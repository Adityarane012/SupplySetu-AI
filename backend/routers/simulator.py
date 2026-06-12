import shutil
import tempfile
import os
from datetime import date
from fastapi import APIRouter, Form, UploadFile, File, HTTPException
from typing import Optional, Annotated
from services.whisper_service import transcribe_audio
from services.llm_service import extract_order
from db.supabase_client import supabase

router = APIRouter()

ALLOWED_AUDIO_EXT = {".ogg", ".mp3", ".wav", ".m4a", ".webm", ".opus", ".flac"}


def _upsert_customer(name: str, phone: str) -> dict:
    """Get or create customer record, updating name if it changed."""
    existing = supabase.table("customers").select("*").eq("phone", phone).execute()
    if existing.data:
        customer = existing.data[0]
        if customer["name"] != name:
            supabase.table("customers").update({"name": name}).eq("id", customer["id"]).execute()
            customer["name"] = name
        return customer
    return supabase.table("customers").insert({"name": name, "phone": phone}).execute().data[0]


def _build_reply(customer_name: str, items: list, transcript: str, delivery_date: str | None, notes: str | None) -> str:
    """Build a natural, WhatsApp-style reply."""
    if not items:
        return (
            f"🤔 *Hi {customer_name}!*\n\n"
            f"I received your message but couldn't identify specific items or quantities.\n\n"
            f"Please try:\n"
            f"  • _\"20 kg tamatar aur 10 kg pyaz\"_\n"
            f"  • _\"I need 5 kg potato and 2 dozen banana\"_\n\n"
            f"- *SupplySetu AI* 🌿"
        )

    item_lines = "\n".join(
        f"  • {i.get('quantity')} {i.get('unit', 'kg')} {i.get('product_name', 'Item')}"
        for i in items
    )

    date_line = ""
    if delivery_date:
        try:
            d = date.fromisoformat(delivery_date)
            date_line = f"\n📅 *Delivery:* {d.strftime('%A, %d %b %Y')}"
        except ValueError:
            date_line = f"\n📅 *Delivery:* {delivery_date}"

    notes_line = f"\n📝 *Notes:* {notes}" if notes else ""

    return (
        f"✅ *Order Confirmed!*\n\n"
        f"Hello {customer_name}, here's your order summary:\n\n"
        f"{item_lines}"
        f"{date_line}"
        f"{notes_line}\n\n"
        f"We'll process and deliver soon. 🛵\n"
        f"— *SupplySetu AI*"
    )


@router.post("/message")
async def receive_simulator_message(
    customer_name: Annotated[str, Form()],
    customer_phone: Annotated[str, Form()],
    body: Annotated[str, Form()] = "",
    audio: Optional[UploadFile] = File(None),
):
    transcript = None
    source = "whatsapp_text"
    transcription_meta = {}

    # ── 1. Handle audio upload ──────────────────────────────────────────────
    if audio and audio.filename:
        ext = os.path.splitext(audio.filename)[1].lower()
        if ext not in ALLOWED_AUDIO_EXT:
            ext = ".webm"  # sensible default for browser recordings

        tmp_path = None
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
                shutil.copyfileobj(audio.file, tmp)
                tmp_path = tmp.name

            result = transcribe_audio(tmp_path)
            transcript = result["transcript"]
            transcription_meta = {
                "language": result.get("language"),
                "duration_seconds": result.get("duration_seconds"),
                "source": result.get("source"),
            }
            source = "whatsapp_voice"

        except Exception as e:
            print(f"[Simulator] Audio transcription error: {e}")
            return {
                "reply": (
                    "⚠️ *Voice note couldn't be processed.*\n\n"
                    "This can happen with very short clips or unsupported formats.\n"
                    "Please try typing your order — it works just as well! 🙏"
                ),
                "order": None,
                "transcript": None,
                "error": str(e),
            }
        finally:
            if tmp_path and os.path.exists(tmp_path):
                os.unlink(tmp_path)

    # ── 2. Handle text message ──────────────────────────────────────────────
    elif body.strip():
        transcript = body.strip()

    # ── 3. Nothing received ─────────────────────────────────────────────────
    if not transcript:
        return {
            "reply": "😕 I didn't receive anything. Please send a text or voice note with your order.",
            "order": None,
            "transcript": None,
        }

    # ── 4. Extract structured order via LLM ────────────────────────────────
    extracted = await extract_order(transcript)
    items = extracted.get("items", [])
    delivery_date = extracted.get("delivery_date")
    notes = extracted.get("notes")
    confidence = extracted.get("confidence", 0.0)

    # ── 5. Upsert customer ──────────────────────────────────────────────────
    customer = _upsert_customer(customer_name, customer_phone)

    # ── 6. Save order to DB ─────────────────────────────────────────────────
    order_row = supabase.table("orders").insert({
        "customer_id": customer["id"],
        "customer_name": customer["name"],
        "status": "pending",
        "source": source,
        "raw_transcript": transcript,
        "scheduled_date": delivery_date or str(date.today()),
        "notes": notes,
    }).execute().data[0]

    if items:
        supabase.table("order_items").insert([
            {
                "order_id": order_row["id"],
                "product_name": item.get("product_name", "Unknown"),
                "quantity": max(float(item.get("quantity", 1)), 0),
                "unit": item.get("unit", "kg"),
            }
            for item in items
        ]).execute()

    # ── 7. Build and return reply ───────────────────────────────────────────
    reply = _build_reply(customer["name"], items, transcript, delivery_date, notes)

    print(f"[Simulator] Order {order_row['id'][:8]} — {len(items)} items, confidence={confidence:.2f}, source={source}")

    return {
        "reply": reply,
        "transcript": transcript,
        "order_id": str(order_row["id"]),
        "extracted": extracted,
        "customer": customer,
        "transcription": transcription_meta,
    }


@router.get("/history/{customer_phone}")
def get_chat_history(customer_phone: str, limit: int = 20):
    """Return recent orders for a customer phone number."""
    customer = supabase.table("customers").select("*").eq("phone", customer_phone).execute()
    if not customer.data:
        return []

    orders = (
        supabase.table("orders")
        .select("*, order_items(*)")
        .eq("customer_id", customer.data[0]["id"])
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return orders.data
