from typing import List, Dict, Any, Optional

def reconstruct_snapshots(history_entries: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Reconstructs the full state of an order at each point in its history.
    Because history logging is best-effort and can have gaps, this function
    verifies the `before_data` of each entry against its running state. 
    On a mismatch, it marks the snapshot and all future ones as `approximate`.
    """
    snapshots = []
    
    if not history_entries:
        return snapshots
        
    # Find the created entry
    created_entry = next((e for e in history_entries if e.get("change_type") == "created"), None)
    
    is_approximate = False
    approx_reason = None
    
    # Initialize base state
    current_state = {
        "status": "pending",
        "notes": None,
        "items": []
    }
    
    if created_entry:
        after_data = created_entry.get("after_data") or {}
        current_state["items"] = after_data.get("items", [])
    else:
        is_approximate = True
        approx_reason = "Missing 'created' history entry"
        
    for entry in history_entries:
        change_type = entry.get("change_type")
        before_data = entry.get("before_data")
        after_data = entry.get("after_data")
        
        # Verify consistency if not already approximate
        if not is_approximate and before_data:
            if change_type == "status_changed":
                if current_state["status"] != before_data.get("status"):
                    is_approximate = True
                    approx_reason = f"Status mismatch: expected {before_data.get('status')} but was {current_state['status']}"
            elif change_type == "notes_changed":
                # Treat empty string and None as equivalent for notes
                c_notes = current_state["notes"] or ""
                b_notes = before_data.get("notes") or ""
                if c_notes != b_notes:
                    is_approximate = True
                    approx_reason = "Notes mismatch before update"
            elif change_type == "items_changed":
                # items_changed before_data is a list of items
                c_items_len = len(current_state["items"])
                b_items_len = len(before_data) if isinstance(before_data, list) else 0
                if c_items_len != b_items_len:
                    is_approximate = True
                    approx_reason = "Items list mismatch before update"
                    
        # Apply deltas
        if after_data:
            if change_type == "status_changed":
                current_state["status"] = after_data.get("status", current_state["status"])
            elif change_type == "notes_changed":
                current_state["notes"] = after_data.get("notes", current_state["notes"])
            elif change_type == "items_changed":
                if isinstance(after_data, list):
                    current_state["items"] = after_data
            elif change_type == "deleted":
                current_state["status"] = "deleted"
            elif change_type == "created":
                # handled during initialization, but just to be safe:
                if isinstance(after_data, dict) and "items" in after_data:
                    current_state["items"] = after_data["items"]

        snapshots.append({
            "timestamp": entry.get("created_at"),
            "change_type": change_type,
            "summary": entry.get("summary"),
            "intent": entry.get("intent"),
            "state": {
                "status": current_state["status"],
                "notes": current_state["notes"],
                "items": list(current_state["items"])  # clone
            },
            "approximate": is_approximate,
            "approximate_reason": approx_reason
        })
        
    return snapshots
