import shutil
import tempfile
import os
from fastapi import APIRouter, UploadFile, File, HTTPException
from services.whisper_service import transcribe_audio
from services.llm_service import extract_order

router = APIRouter()

ALLOWED_EXTENSIONS = {".ogg", ".mp3", ".wav", ".m4a", ".webm", ".opus"}


@router.post("/")
async def transcribe(file: UploadFile = File(...)):
    filename = file.filename or "upload"
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"Unsupported file type: {ext}. Use: {ALLOWED_EXTENSIONS}")

    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    try:
        result = transcribe_audio(tmp_path)
    finally:
        os.unlink(tmp_path)

    return result


@router.post("/extract")
async def extract(body: dict):
    transcript = body.get("transcript", "").strip()
    if not transcript:
        raise HTTPException(400, "No transcript provided")
    result = await extract_order(transcript)
    return result
