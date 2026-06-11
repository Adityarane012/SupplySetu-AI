from faster_whisper import WhisperModel
import os

_model_size = os.getenv("WHISPER_MODEL_SIZE", "base")
_model: WhisperModel | None = None


def get_model() -> WhisperModel:
    global _model
    if _model is None:
        print(f"[Whisper] Loading model: {_model_size} (first call, may take a moment...)")
        _model = WhisperModel(_model_size, device="cpu", compute_type="int8")
        print("[Whisper] Model loaded.")
    return _model


def transcribe_audio(file_path: str) -> dict:
    model = get_model()
    segments, info = model.transcribe(file_path, beam_size=5)
    transcript = " ".join(seg.text.strip() for seg in segments)
    return {
        "transcript": transcript.strip(),
        "language": info.language,
        "duration_seconds": round(info.duration, 2),
    }
