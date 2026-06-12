import httpx
import json
import os

OLLAMA_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
MODEL = os.getenv("OLLAMA_MODEL", "llama3.2:3b")

EXTRACT_PROMPT = """You are an order extraction assistant for an Indian vegetable/grocery vendor.
The customer's message may be in Hindi, Marathi, English, or Hinglish.

Extract order details and return ONLY valid JSON — no explanation, no markdown, just the JSON object.

Required format:
{{
  "customer": "<customer name if mentioned, else 'Unknown'>",
  "items": [
    {{"product_name": "<item name in English>", "quantity": <number>, "unit": "<kg|piece|dozen|litre|bundle>"}}
  ],
  "delivery_date": "<YYYY-MM-DD if mentioned, else null>",
  "confidence": <0.0 to 1.0>
}}

Examples:
- "20 kilo tamatar" → {{"product_name": "Tomato", "quantity": 20, "unit": "kg"}}
- "ek darjan kela" → {{"product_name": "Banana", "quantity": 1, "unit": "dozen"}}
- "15 kg pyaz" → {{"product_name": "Onion", "quantity": 15, "unit": "kg"}}

Customer message: {transcript}"""


GROQ_API_KEY = os.getenv("GROQ_API_KEY")
# Default to cloud if key exists, otherwise local. Explicit toggle overrides this.
USE_LOCAL_MODEL = os.getenv("USE_LOCAL_MODEL", "false" if GROQ_API_KEY else "true").lower() == "true"

async def extract_order(transcript: str) -> dict:
    prompt = EXTRACT_PROMPT.format(transcript=transcript)
    
    # Toggle logic: If USE_LOCAL_MODEL is false and we have a Groq key, use cloud.
    # Otherwise, fallback to the local Ollama model.
    if not USE_LOCAL_MODEL and GROQ_API_KEY:
        print("[LLM] Using Groq Cloud API for extraction...")
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {GROQ_API_KEY}"},
                json={
                    "model": "llama3-8b-8192",
                    "messages": [{"role": "user", "content": prompt}],
                    "response_format": {"type": "json_object"}
                }
            )
            resp.raise_for_status()
            raw = resp.json()["choices"][0]["message"]["content"]
    else:
        print("[LLM] Using local Ollama model...")
        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(
                f"{OLLAMA_URL}/api/generate",
                json={
                    "model": MODEL,
                    "prompt": prompt,
                    "stream": False,
                    "format": "json",
                },
            )
            resp.raise_for_status()
            raw = resp.json().get("response", "{}")
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        # Fallback: return transcript as manual entry
        return {
            "customer": "Unknown",
            "items": [],
            "delivery_date": None,
            "confidence": 0.0,
            "raw_response": raw,
        }
