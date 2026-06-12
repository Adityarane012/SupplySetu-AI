import shutil
import tempfile
import os
from fastapi import APIRouter, Form, UploadFile, File
from typing import Optional, Annotated
from services.whisper_service import transcribe_audio
from services.llm_service import extract_order
from db.supabase_client import supabase

router = APIRouter()

ALLOWED_AUDIO_EXT = {".ogg", ".mp3", ".wav", ".m4a", ".webm", ".opus"}


@router.post("/message")
async def receive_simulator_message(
    customer_name: Annotated[str, Form()],
    customer_phone: Annotated[str, Form()],
    body: Annotated[str, Form()] = "",
    audio: Optional[UploadFile] = File(None),
):
    transcript = None
    source = "whatsapp_text"

    # Handle voice note upload
    if audio and audio.filename:
        ext = os.path.splitext(audio.filename)[1].lower()
        if ext not in ALLOWED_AUDIO_EXT:
            ext = ".ogg"
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
            shutil.copyfileobj(audio.file, tmp)
            tmp_path = tmp.name
        try:
            result = transcribe_audio(tmp_path)
            transcript = result["transcript"]
        except Exception as e:
            print(f"[Simulator] Audio transcription failed: {e}")
            os.unlink(tmp_path)
            return {
                "reply": "⚠️ Sorry, I couldn't process that voice note. Please try typing your order instead!",
                "order": None,
                "transcript": None,
            }
        finally:
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)
        source = "whatsapp_voice"
    elif body.strip():
        transcript = body.strip()

    if not transcript:
        return {
            "reply": "Sorry, I didn't catch that. Please try again! 🙏",
            "order": None,
            "transcript": None,
        }

    # Extract structured order from transcript
    extracted = await extract_order(transcript)

    # Upsert customer
    existing = supabase.table("customers").select("*").eq("phone", customer_phone).execute()
    if existing.data:
        customer = existing.data[0]
        # Update name if it changed
        if customer["name"] != customer_name:
            supabase.table("customers").update({"name": customer_name}).eq("id", customer["id"]).execute()
            customer["name"] = customer_name
    else:
        customer = supabase.table("customers").insert({
            "name": customer_name,
            "phone": customer_phone,
        }).execute().data[0]

    # Create order
    order = supabase.table("orders").insert({
        "customer_id": customer["id"],
        "customer_name": customer["name"],
        "status": "pending",
        "source": source,
        "raw_transcript": transcript,
    }).execute().data[0]

    # Insert items
    items = extracted.get("items", [])
    if items:
        supabase.table("order_items").insert([
            {
                "order_id": order["id"],
                "product_name": item.get("product_name", "Unknown"),
                "quantity": item.get("quantity", 1),
                "unit": item.get("unit", "kg"),
            }
            for item in items
        ]).execute()

    # Build WhatsApp-style reply
    if items:
        item_lines = "\n".join(
            f"  • {i.get('quantity')} {i.get('unit', 'kg')} {i.get('product_name')}"
            for i in items
        )
        reply = f"✅ *Order Confirmed!*\n\nHello {customer['name']}, I've noted your order:\n{item_lines}\n\nWe'll deliver soon. 🛵 - *SupplySetu AI*"
    else:
        reply = f"🤔 I received your message but couldn't identify specific items. Please resend with item names and quantities."

    return {
        "reply": reply,
        "transcript": transcript,
        "order_id": str(order["id"]),
        "extracted": extracted,
        "customer": customer,
    }


@router.get("/history/{customer_phone}")
def get_chat_history(customer_phone: str, limit: int = 20):
    """Return recent orders for a customer phone number to show in chat."""
    customer = supabase.table("customers").select("*").eq("phone", customer_phone).execute()
    if not customer.data:
        return []

    cust_id = customer.data[0]["id"]
    orders = (
        supabase.table("orders")
        .select("*, order_items(*)")
        .eq("customer_id", cust_id)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return orders.data
