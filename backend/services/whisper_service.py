import httpx
import os

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
# Default to cloud if key exists, otherwise local. Explicit toggle overrides this.
USE_LOCAL_MODEL = os.getenv("USE_LOCAL_MODEL", "false" if GROQ_API_KEY else "true").lower() == "true"

_model_size = os.getenv("WHISPER_MODEL_SIZE", "base")
_model = None

def get_model():
    global _model
    if _model is None:
        from faster_whisper import WhisperModel
        print(f"[Whisper] Loading model: {_model_size} (first call, may take a moment...)")
        _model = WhisperModel(_model_size, device="cpu", compute_type="int8")
        print("[Whisper] Model loaded.")
    return _model

def transcribe_audio(file_path: str) -> dict:
    # Toggle logic: If USE_LOCAL_MODEL is false and we have a Groq key, use cloud.
    # Otherwise, fallback to the local Whisper model.
    if not USE_LOCAL_MODEL and GROQ_API_KEY:
        print("[Whisper] Using Groq Cloud API for transcription...")
        with open(file_path, "rb") as f:
            files = {
                "file": (os.path.basename(file_path), f, "audio/webm"),
            }
            data = {"model": "whisper-large-v3"}
            response = httpx.post(
                "https://api.groq.com/openai/v1/audio/transcriptions",
                headers={"Authorization": f"Bearer {GROQ_API_KEY}"},
                data=data,
                files=files,
                timeout=30.0
            )
            response.raise_for_status()
            res_data = response.json()
            return {
                "transcript": res_data.get("text", "").strip(),
                "language": "unknown (groq)",
                "duration_seconds": 0.0,
            }
    else:
        model = get_model()
        segments, info = model.transcribe(file_path, beam_size=5)
        transcript = " ".join(seg.text.strip() for seg in segments)
        return {
            "transcript": transcript.strip(),
            "language": info.language,
            "duration_seconds": round(info.duration, 2),
        }
