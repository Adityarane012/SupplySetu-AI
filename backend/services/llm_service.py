import httpx
import json
import os
import time

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
USE_LOCAL_MODEL = os.getenv("USE_LOCAL_MODEL", "false" if GROQ_API_KEY else "true").lower() == "true"
OLLAMA_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2:3b")

EXTRACT_PROMPT = """\
You are an intelligent, fault-tolerant order extraction assistant for an Indian vegetable and grocery supplier.
The customer's message may be in Hindi, Marathi, English, or Hinglish (mixed). It may contain emojis, customer names, delivery dates, or prices.

Your task: Extract the order details and return ONLY valid JSON. Ignore prices, greetings, emojis, and irrelevant text.

Output format MUST match exactly:
{{
  "customer": "<extracted name or 'Unknown'>",
  "items": [
    {{"product_name": "<English name>", "quantity": <number>, "unit": "<kg|piece|dozen|litre|bundle|gram>"}}
  ],
  "delivery_date": "<YYYY-MM-DD or relative date like 'kal', 'udya', 'tomorrow', 'today', 'kal subah', 'parso', 'parva', 'paro', 'parvi' if mentioned, else null>",
  "notes": "<any special instructions, else null>",
  "intent": "<one short sentence in plain English capturing WHY the customer is placing this order — their underlying goal or purpose (e.g. 'Weekly restock for the store', 'Extra tomatoes needed for a family function', 'Urgent shortage refill'). Infer this from context/notes/wording; if nothing can be inferred, briefly describe the order itself, e.g. 'Routine grocery order'.>",
  "is_amendment": <true|false>,
  "confidence": <0.0 to 1.0>
}}

Extraction Rules:
1. Extract ALL food/grocery items requested. Ignore non-food items.
2. If a quantity is decimal (e.g. "2.5"), preserve it as a float.
3. If no quantity is specified for an item, default to 1.
4. Ignore prices (e.g., "Rs 30/kg", "50 rupees"). Do NOT confuse price with quantity.
5. Translate all product names to English (tamatar -> Tomato, pyaz -> Onion, etc).
6. If the message contains no food/grocery items, return an empty "items" array: []
7. "intent" must always be a short, human-readable sentence — never null and never empty.
8. "is_amendment" must be true if the message is revising a previous order (e.g. "actually", "instead", "change it to", "make it", "badal do", "nahi nahi", "add also").

Examples:
- "20 kg tamatar aur 15 kg pyaz" → items: [{"product_name":"Tomato","quantity":20,"unit":"kg"},{"product_name":"Onion","quantity":15,"unit":"kg"}], intent: "Routine grocery order", is_amendment: false
- "Ramesh here - need 10 kg tomato, ghar mein function hai" → customer: "Ramesh", items: [{"product_name":"Tomato","quantity":10,"unit":"kg"}], intent: "Extra tomatoes needed for a family function at home", is_amendment: false
- "10 kg tomato at Rs 30 per kg" → items: [{"product_name":"Tomato","quantity":10,"unit":"kg"}] (price ignored), intent: "Routine grocery order", is_amendment: false
- "🍅 20 kg tamatar please, weekly order" → items: [{"product_name":"Tomato","quantity":20,"unit":"kg"}] (emoji ignored), intent: "Weekly restock for the store", is_amendment: false
- "actually make it 30 kg, guests aa rahe hain" → items: [{"product_name":"Tomato","quantity":30,"unit":"kg"}], intent: "More quantity needed for guests", is_amendment: true

Customer message: {transcript}"""


def _parse_json_safe(raw: str) -> dict:
    """Parse JSON with fallback for common LLM formatting issues."""
    raw = raw.strip()
    # Strip markdown code fences if present
    if raw.startswith("```"):
        lines = raw.split("\n")
        raw = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        # Try extracting the first {...} block
        start = raw.find("{")
        end = raw.rfind("}") + 1
        if start != -1 and end > start:
            try:
                return json.loads(raw[start:end])
            except json.JSONDecodeError:
                pass
    print(f"[LLM] JSON parse failed. Raw output: {raw[:300]}")
    return {"items": [], "delivery_date": None, "notes": None, "intent": None, "confidence": 0.0, "is_amendment": False}


async def _groq_extract(prompt: str) -> str:
    """Call Groq LLM with retry logic."""
    last_err = None
    for attempt in range(1, 3):
        try:
            print(f"[LLM] Groq attempt {attempt}…")
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={"Authorization": f"Bearer {GROQ_API_KEY}"},
                    json={
                        "model": "llama-3.1-8b-instant",
                        "messages": [
                            {
                                "role": "system",
                                "content": "You are a precise JSON-only order extraction assistant. Never output anything except valid JSON.",
                            },
                            {"role": "user", "content": prompt},
                        ],
                        "response_format": {"type": "json_object"},
                        "temperature": 0.1,  # low temp for deterministic structured output
                        "max_tokens": 512,
                    },
                )
            resp.raise_for_status()
            content = resp.json()["choices"][0]["message"]["content"]
            print(f"[LLM] Groq OK — {len(content)} chars")
            return content
        except httpx.HTTPStatusError as e:
            last_err = e
            print(f"[LLM] Groq HTTP {e.response.status_code}: {e.response.text[:200]}")
            if e.response.status_code in (400, 401, 403):
                break
            await _async_sleep(1.5)
        except Exception as e:
            last_err = e
            print(f"[LLM] Groq attempt {attempt} error: {e}")
            await _async_sleep(1.5)
    raise RuntimeError(f"Groq LLM failed: {last_err}")


async def _ollama_extract(prompt: str) -> str:
    """Call local Ollama LLM."""
    print(f"[LLM] Using local Ollama ({OLLAMA_MODEL})…")
    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.post(
            f"{OLLAMA_URL}/api/generate",
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
                "format": "json",
            },
        )
    resp.raise_for_status()
    raw = resp.json().get("response", "{}")
    print(f"[LLM] Ollama OK — {len(raw)} chars")
    return raw


async def _async_sleep(seconds: float):
    import asyncio
    await asyncio.sleep(seconds)


async def extract_order(transcript: str) -> dict:
    """
    Extract structured order from a customer transcript.
    Strategy:
      1. If GROQ_API_KEY is set → use Groq cloud LLM (fast, accurate)
      2. Otherwise → use local Ollama (requires Ollama running locally)
    Always returns a valid dict (never raises to caller).
    """
    prompt = EXTRACT_PROMPT.format(transcript=transcript)

    try:
        if GROQ_API_KEY:
            raw = await _groq_extract(prompt)
        else:
            raw = await _ollama_extract(prompt)
        result = _parse_json_safe(raw)
        # Normalise: ensure items always exists
        if "items" not in result:
            result["items"] = []
        return result

    except Exception as e:
        print(f"[LLM] All extraction attempts failed: {e}")
        return {
            "items": [],
            "delivery_date": None,
            "notes": None,
            "intent": None,
            "confidence": 0.0,
            "error": str(e),
            "is_amendment": False,
        }
