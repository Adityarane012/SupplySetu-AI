import httpx
import os
import time
import asyncio
import logging

# Configure structured logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("whisper_service")

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
        logger.info(f"Loading local model: {WHISPER_MODEL_SIZE}…")
        t0 = time.time()
        
        # Determine if we are in a cloud environment where GPU is unlikely/unsupported
        # Vercel sets VERCEL=1, Render sets RENDER=true, AWS Lambda sets AWS_LAMBDA_FUNCTION_NAME
        is_cloud = any(os.environ.get(k) for k in ["VERCEL", "RENDER", "AWS_LAMBDA_FUNCTION_NAME"])
        disable_gpu = os.environ.get("DISABLE_GPU", "false").lower() == "true"
        
        device = "cpu"
        compute_type = "int8"
        
        if is_cloud or disable_gpu:
            logger.info("Cloud environment detected or GPU explicitly disabled. Defaulting to CPU.")
        else:
            try:
                import ctranslate2
                if ctranslate2.get_cuda_device_count() > 0:
                    device = "cuda"
                    compute_type = "float16"
                    logger.info("CUDA GPU detected.")
                else:
                    logger.info("No CUDA GPU detected. Defaulting to CPU.")
            except Exception as e:
                logger.warning(f"Failed to check CUDA availability ({e}). Defaulting to CPU.")

        try:
            if device == "cuda":
                logger.info("Attempting to load with GPU (CUDA)…")
                _local_model = WhisperModel(WHISPER_MODEL_SIZE, device="cuda", compute_type="float16")
                logger.info(f"GPU Model ready in {time.time() - t0:.2f}s")
            else:
                _local_model = WhisperModel(WHISPER_MODEL_SIZE, device="cpu", compute_type="int8")
                logger.info(f"CPU Model ready in {time.time() - t0:.2f}s")
        except Exception as e:
            if device == "cuda":
                # Safely fallback to CPU if GPU is unavailable but was attempted
                logger.warning(f"GPU load failed ({e}). Falling back to CPU…")
                t1 = time.time()
                _local_model = WhisperModel(WHISPER_MODEL_SIZE, device="cpu", compute_type="int8")
                logger.info(f"CPU Model ready in {time.time() - t1:.2f}s")
            else:
                logger.error(f"Failed to load Whisper model on CPU: {e}")
                raise RuntimeError(f"Failed to load Whisper model on CPU: {e}")
            
    return _local_model


# Create a global AsyncClient for connection pooling
# This significantly reduces latency by reusing TCP connections to api.groq.com
_http_client = httpx.AsyncClient(timeout=45.0)

async def _groq_transcribe(file_path: str) -> dict:
    """Transcribe via Groq Whisper-large-v3 cloud API with retry."""
    ext = os.path.splitext(file_path)[1].lower()
    mime = GROQ_MIME_MAP.get(ext, "audio/webm")
    fname = os.path.basename(file_path)

    last_err = None
    t0 = time.time()
    for attempt in range(1, 3):  # up to 2 attempts
        try:
            logger.info(f"Groq attempt {attempt} — {fname} ({mime})")
            with open(file_path, "rb") as f:
                response = await _http_client.post(
                    "https://api.groq.com/openai/v1/audio/transcriptions",
                    headers={"Authorization": f"Bearer {GROQ_API_KEY}"},
                    data={
                        "model": "whisper-large-v3",
                        "language": "hi",          # hint: Hindi/Hinglish dominant
                        "response_format": "json",
                    },
                    files={"file": (fname, f, mime)}
                )
            response.raise_for_status()
            text = response.json().get("text", "").strip()
            duration = time.time() - t0
            snippet = f"'{text[:80]}…'" if len(text) > 80 else f"'{text}'"
            logger.info(f"Groq OK in {duration:.2f}s — {snippet}")
            return {
                "transcript": text,
                "language": "auto (groq)",
                "duration_seconds": 0.0,
                "source": "groq",
            }
        except httpx.HTTPStatusError as e:
            last_err = e
            logger.error(f"Groq HTTP error {e.response.status_code}: {e.response.text[:200]}")
            if e.response.status_code in (400, 401, 403):
                break  # no point retrying auth/format errors
            await asyncio.sleep(1.5)
        except Exception as e:
            last_err = e
            logger.warning(f"Groq attempt {attempt} failed: {e}")
            await asyncio.sleep(1.5)

    logger.error(f"Groq transcription failed after retries: {last_err}")
    raise RuntimeError(f"Groq transcription failed after retries: {last_err}")


async def _local_transcribe(file_path: str) -> dict:
    """Fallback: transcribe locally with faster-whisper."""
    logger.info("Falling back to local faster-whisper model…")
    t0 = time.time()
    
    def _run_transcribe():
        model = _get_local_model()
        segments, info = model.transcribe(file_path, beam_size=5)
        text = " ".join(seg.text.strip() for seg in segments).strip()
        return text, info
        
    transcript, info = await asyncio.to_thread(_run_transcribe)
    duration = time.time() - t0
    
    snippet = f"'{transcript[:80]}…'" if len(transcript) > 80 else f"'{transcript}'"
    logger.info(f"Local OK in {duration:.2f}s — lang={info.language}, {snippet}")
    return {
        "transcript": transcript,
        "language": info.language,
        "duration_seconds": round(info.duration, 2),
        "source": "local",
    }


async def transcribe_audio(file_path: str) -> dict:
    """
    Transcribe audio file to text.
    Strategy:
      1. If GROQ_API_KEY is set → use Groq cloud (fast, multilingual, no GPU needed)
      2. Otherwise → use local faster-whisper (requires model download)
    Raises RuntimeError if both paths fail.
    """
    if GROQ_API_KEY:
        return await _groq_transcribe(file_path)
    elif not USE_LOCAL_MODEL:
        logger.error("No GROQ_API_KEY set and USE_LOCAL_MODEL=false.")
        raise RuntimeError(
            "No GROQ_API_KEY set and USE_LOCAL_MODEL=false. "
            "Set GROQ_API_KEY in environment to enable transcription."
        )
    else:
        return await _local_transcribe(file_path)

def preload_model():
    """Preloads the local model into memory if local inference is enabled.
    This prevents the first-request latency spike.
    """
    if USE_LOCAL_MODEL:
        logger.info("Pre-loading model in background...")
        try:
            _get_local_model()
            logger.info("Background pre-load complete.")
        except Exception as e:
            logger.error(f"Pre-load failed: {e}")
