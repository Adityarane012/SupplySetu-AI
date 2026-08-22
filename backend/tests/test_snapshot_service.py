import pytest
from services.snapshot_service import reconstruct_snapshots

def test_reconstruct_snapshots_clean():
    entries = [
        {
            "change_type": "created",
            "summary": "Order created",
            "created_at": "2023-01-01T10:00:00Z",
            "after_data": {"items": [{"product_name": "Apple", "quantity": 10, "unit": "kg"}]}
        },
        {
            "change_type": "status_changed",
            "summary": "Status changed to in_transit",
            "created_at": "2023-01-01T11:00:00Z",
            "before_data": {"status": "pending"},
            "after_data": {"status": "in_transit"}
        },
        {
            "change_type": "items_changed",
            "summary": "Items changed",
            "created_at": "2023-01-01T12:00:00Z",
            "before_data": [{"product_name": "Apple", "quantity": 10, "unit": "kg"}],
            "after_data": [{"product_name": "Apple", "quantity": 15, "unit": "kg"}]
        }
    ]
    
    snapshots = reconstruct_snapshots(entries)
    
    assert len(snapshots) == 3
    
    s0 = snapshots[0]
    assert not s0["approximate"]
    assert s0["state"]["status"] == "pending"
    assert s0["state"]["items"][0]["quantity"] == 10
    
    s1 = snapshots[1]
    assert not s1["approximate"]
    assert s1["state"]["status"] == "in_transit"
    assert s1["state"]["items"][0]["quantity"] == 10
    
    s2 = snapshots[2]
    assert not s2["approximate"]
    assert s2["state"]["status"] == "in_transit"
    assert s2["state"]["items"][0]["quantity"] == 15


def test_reconstruct_snapshots_missing_created():
    entries = [
        {
            "change_type": "status_changed",
            "summary": "Status changed to in_transit",
            "created_at": "2023-01-01T11:00:00Z",
            "before_data": {"status": "pending"},
            "after_data": {"status": "in_transit"}
        }
    ]
    
    snapshots = reconstruct_snapshots(entries)
    
    assert len(snapshots) == 1
    assert snapshots[0]["approximate"] is True
    assert snapshots[0]["approximate_reason"] == "Missing 'created' history entry"
    assert snapshots[0]["state"]["status"] == "in_transit"


def test_reconstruct_snapshots_inconsistent_history():
    entries = [
        {
            "change_type": "created",
            "summary": "Order created",
            "created_at": "2023-01-01T10:00:00Z",
            "after_data": {"items": []}
        },
        {
            "change_type": "status_changed",
            "summary": "Status changed to in_transit",
            "created_at": "2023-01-01T11:00:00Z",
            # Invalid before_data: we expect it to be pending, but history says something else
            "before_data": {"status": "delivered"},
            "after_data": {"status": "in_transit"}
        }
    ]
    
    snapshots = reconstruct_snapshots(entries)
    
    assert not snapshots[0]["approximate"]
    assert snapshots[1]["approximate"] is True
    assert "Status mismatch" in snapshots[1]["approximate_reason"]
    assert snapshots[1]["state"]["status"] == "in_transit"
