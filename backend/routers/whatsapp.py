import os
import tempfile
import httpx
from datetime import date
from services.time_service import today_ist
from twilio.request_validator import RequestValidator
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import Response
from twilio.twiml.messaging_response import MessagingResponse

from services.whisper_service import transcribe_audio
from services.llm_service import extract_order
from services.history_service import log_order_created, log_history, find_amendable_order, apply_amendment
from db.supabase_client import supabase
from routers.simulator import _upsert_customer, _sanitise_delivery_date, _build_reply

router = APIRouter()

# Read Twilio credentials for authenticating media downloads
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_VALIDATE_SIGNATURE = os.getenv("TWILIO_VALIDATE_SIGNATURE", "true").lower() == "true"
validator = RequestValidator(TWILIO_AUTH_TOKEN)

async def download_twilio_media(media_url: str) -> str:
    """Securely downloads Twilio media to a temporary file."""
    # Twilio Sandbox often requires basic auth using the account SID and Token
    auth = (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN) if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN else None
    
    async with httpx.AsyncClient() as client:
        # Follow redirects in case Twilio redirects the media request
        response = await client.get(media_url, auth=auth, follow_redirects=True)
        response.raise_for_status()
        
        # Determine extension from Content-Type, defaulting to .ogg for voice notes
        content_type = response.headers.get("Content-Type", "")
        ext = ".ogg"
        if "audio/mp4" in content_type or "audio/m4a" in content_type:
            ext = ".m4a"
        elif "audio/mpeg" in content_type:
            ext = ".mp3"
            
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
            tmp.write(response.content)
            return tmp.name

@router.post("/webhook")
async def twilio_whatsapp_webhook(request: Request):
    """
    Webhook endpoint to receive incoming WhatsApp messages from Twilio Sandbox.
    """
    form_data = await request.form()
    
    # Validate Twilio Signature
    if TWILIO_VALIDATE_SIGNATURE:
        signature = request.headers.get("X-Twilio-Signature", "")
        proto = request.headers.get("X-Forwarded-Proto")
        url = str(request.url)
        if proto:
            url = url.replace(request.url.scheme + "://", proto + "://", 1)
            
        post_vars = dict(form_data)
        if not validator.validate(url, post_vars, signature):
            raise HTTPException(status_code=403, detail="Invalid Twilio signature")

    message_sid = form_data.get("MessageSid")
    if message_sid:
        # Claim processing lock by inserting immediately
        try:
            supabase.table("messages").insert({
                "direction": "inbound",
                "twilio_message_sid": message_sid,
                "source": "whatsapp"
            }).execute()
        except Exception as e:
            # postgrest handles duplicate keys by raising an APIError; we check the string loosely
            if "duplicate key value" in str(e).lower() or "unique constraint" in str(e).lower() or "23505" in str(e):
                print(f"[WhatsApp] Duplicate Twilio request received: {message_sid}. Ignoring.")
                return _send_twiml("")

    
    # Twilio sends phone numbers formatted as 'whatsapp:+1234567890'
    raw_from = form_data.get("From", "")
    customer_phone = raw_from.replace("whatsapp:", "") if raw_from.startswith("whatsapp:") else raw_from
    customer_name = form_data.get("ProfileName", "WhatsApp User")
    
    body = form_data.get("Body", "").strip()
    num_media = int(form_data.get("NumMedia", 0))
    media_url_0 = form_data.get("MediaUrl0")
    media_content_type_0 = form_data.get("MediaContentType0", "")
    
    transcript = None
    source = "whatsapp_text"
    tmp_path = None
    
    try:
        # ── 1. Handle Voice Note (Media) ───────────────────────────────────
        if num_media > 0 and media_url_0:
            if not media_content_type_0.startswith("audio/"):
                reply_text = "❌ We currently only support text messages and audio voice notes. Please try again!"
                return _send_twiml(reply_text)
                
            try:
                tmp_path = await download_twilio_media(media_url_0)
                
                # Check file size to avoid transcribing empty files
                if os.path.getsize(tmp_path) < 1024:
                    return _send_twiml("🎤 Your voice note was too short to understand. Please try speaking a bit longer!")
                    
                result = await transcribe_audio(tmp_path)
                transcript = result.get("transcript", "")
                source = "whatsapp_voice"
                
            except Exception as e:
                print(f"[WhatsApp] Media download/transcription failed: {e}")
                return _send_twiml("⚠️ Sorry, we had trouble processing your voice note. Could you please type your order instead?")
            finally:
                if tmp_path and os.path.exists(tmp_path):
                    os.unlink(tmp_path)
                    
        # ── 2. Handle Text Message ─────────────────────────────────────────
        elif body:
            transcript = body
            
        # ── 3. Handle Empty Message ────────────────────────────────────────
        if not transcript:
            return _send_twiml("👋 Welcome to SupplySetu AI! Please send a text or voice note with your order details.")

        # ── 4. Extract Order via LLM ───────────────────────────────────────
        extracted = await extract_order(transcript)
        items = extracted.get("items", [])
        raw_delivery_date = extracted.get("delivery_date")
        notes = extracted.get("notes")
        
        delivery_date = _sanitise_delivery_date(raw_delivery_date)
        
        # ── 5. Unrecognized Order ──────────────────────────────────────────
        if not items:
            print(f"[WhatsApp] No items extracted from: '{transcript[:80]}'")
            reply = _build_reply(customer_name, [], delivery_date, notes)
            return _send_twiml(reply)
            
        # ── 6. Save to Database ────────────────────────────────────────────
        customer = _upsert_customer(customer_name, customer_phone)

        # ── 6b. Check for amendment ────────────────────────────────────────
        if extracted.get("is_amendment"):
            amendable_order = find_amendable_order(customer_phone)
            if amendable_order:
                amend_result = apply_amendment(amendable_order, extracted)
                log_history(
                    order_id=amendable_order["id"],
                    change_type="items_changed",
                    summary=amend_result["summary"],
                    intent=extracted.get("intent", "Order amendment"),
                    source="voice" if source == "whatsapp_voice" else "text",
                    actor=customer_phone,
                    before={"items": amend_result["before"]},
                    after={"items": amend_result["after"]},
                )
                reply = (
                    f"✏️ *Order updated!*\n\n"
                    f"{amend_result['summary']}\n"
                    f"Reason noted: {extracted.get('intent', 'Order amendment')}\n\n"
                    f"— *SupplySetu AI*"
                )
                print(f"[WhatsApp] Amended order {amendable_order['id'][:8]} — {amend_result['summary']}")
                return _send_twiml(reply)
        
        # ── 6c. Save New Order ─────────────────────────────────────────────
        order_row = supabase.table("orders").insert({
            "customer_id": customer["id"],
            "customer_name": customer["name"],
            "status": "pending",
            "source": source,
            "raw_transcript": transcript,
            "scheduled_date": delivery_date or str(today_ist()),
            "notes": notes,
        }).execute().data[0]

        # Insert items
        supabase.table("order_items").insert([
            {
                "order_id": order_row["id"],
                "product_name": item.get("product_name", "Unknown"),
                "quantity": max(float(item.get("quantity", 1)), 0.01),
                "unit": item.get("unit", "kg"),
            }
            for item in items
        ]).execute()

        # Capture the customer's intent behind this order for the change-history timeline
        log_order_created(
            order_id=order_row["id"],
            items=items,
            intent=extracted.get("intent"),
            source="voice" if source == "whatsapp_voice" else "text",
            actor=customer_phone,
        )

        # ── 7. Send Confirmation ───────────────────────────────────────────
        reply = _build_reply(customer["name"], items, delivery_date, notes)
        print(f"[WhatsApp] Successfully processed order {order_row['id'][:8]} for {customer_name}")
        return _send_twiml(reply)
        
    except Exception as e:
        print(f"[WhatsApp] Unexpected error: {e}")
        return _send_twiml("🚨 An unexpected error occurred while processing your order. Our team has been notified. Please try again later!")

def _send_twiml(message: str) -> Response:
    """Helper to format text as a valid Twilio XML response."""
    resp = MessagingResponse()
    resp.message(message)
    return Response(content=str(resp), media_type="application/xml")
