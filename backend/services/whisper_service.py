import httpx
import os
import time

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
USE_LOCAL_MODEL = os.getenv("USE_LOCAL_MODEL", "false" if GROQ_API_KEY else "true").lower() == "true"
WHISPER_MODEL_SIZE = os.getenv("WHISPER_MODEL_SIZE", "base")

# Supported MIME types for Groq (maps extension → mime type)
GROQ_MIME_MAP = {
    ".webm": "audio/webm",
    ".ogg":  "audio/ogg",
    ".mp3":  "audio/mpeg",
    ".wav":  "audio/wav",
    ".m4a":  "audio/mp4",
    ".opus": "audio/ogg",
    ".flac": "audio/flac",
}

_local_model = None


def _get_local_model():
    """Lazy-load faster-whisper model (only used as last resort)."""
    global _local_model
    if _local_model is None:
        from faster_whisper import WhisperModel
        print(f"[Whisper] Loading local model: {WHISPER_MODEL_SIZE}…")
        t0 = time.time()
        _local_model = WhisperModel(WHISPER_MODEL_SIZE, device="cpu", compute_type="int8")
        print(f"[Whisper] Model ready in {time.time() - t0:.1f}s")
    return _local_model


def _groq_transcribe(file_path: str) -> dict:
    """Transcribe via Groq Whisper-large-v3 cloud API with retry."""
    ext = os.path.splitext(file_path)[1].lower()
    mime = GROQ_MIME_MAP.get(ext, "audio/webm")
    fname = os.path.basename(file_path)

    last_err = None
    for attempt in range(1, 3):  # up to 2 attempts
        try:
            print(f"[Whisper] Groq attempt {attempt} — {fname} ({mime})")
            with open(file_path, "rb") as f:
                response = httpx.post(
                    "https://api.groq.com/openai/v1/audio/transcriptions",
                    headers={"Authorization": f"Bearer {GROQ_API_KEY}"},
                    data={
                        "model": "whisper-large-v3",
                        "language": "hi",          # hint: Hindi/Hinglish dominant
                        "response_format": "json",
                    },
                    files={"file": (fname, f, mime)},
                    timeout=45.0,
                )
            response.raise_for_status()
            text = response.json().get("text", "").strip()
            print(f"[Whisper] Groq OK — '{text[:80]}…'" if len(text) > 80 else f"[Whisper] Groq OK — '{text}'")
            return {
                "transcript": text,
                "language": "auto (groq)",
                "duration_seconds": 0.0,
                "source": "groq",
            }
        except httpx.HTTPStatusError as e:
            last_err = e
            print(f"[Whisper] Groq HTTP error {e.response.status_code}: {e.response.text[:200]}")
            if e.response.status_code in (400, 401, 403):
                break  # no point retrying auth/format errors
            time.sleep(1.5)
        except Exception as e:
            last_err = e
            print(f"[Whisper] Groq attempt {attempt} failed: {e}")
            time.sleep(1.5)

    raise RuntimeError(f"Groq transcription failed after retries: {last_err}")


def _local_transcribe(file_path: str) -> dict:
    """Fallback: transcribe locally with faster-whisper."""
    print("[Whisper] Falling back to local faster-whisper model…")
    model = _get_local_model()
    segments, info = model.transcribe(file_path, beam_size=5)
    transcript = " ".join(seg.text.strip() for seg in segments).strip()
    print(f"[Whisper] Local OK — lang={info.language}, '{transcript[:80]}'")
    return {
        "transcript": transcript,
        "language": info.language,
        "duration_seconds": round(info.duration, 2),
        "source": "local",
    }


def transcribe_audio(file_path: str) -> dict:
    """
    Transcribe audio file to text.
    Strategy:
      1. If GROQ_API_KEY is set → use Groq cloud (fast, multilingual, no GPU needed)
      2. Otherwise → use local faster-whisper (requires model download)
    Raises RuntimeError if both paths fail.
    """
    if GROQ_API_KEY:
        return _groq_transcribe(file_path)
    elif not USE_LOCAL_MODEL:
        raise RuntimeError(
            "No GROQ_API_KEY set and USE_LOCAL_MODEL=false. "
            "Set GROQ_API_KEY in environment to enable transcription."
        )
    else:
        return _local_transcribe(file_path)
