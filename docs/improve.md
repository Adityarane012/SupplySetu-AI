# Whisper Service Improvements

Based on the architecture and design documents (`Architecture.md` and `SA_Implementation.md`), here are the recommended improvements for the `backend/services/whisper_service.py` transcription service:

### ✅ [COMPLETED] 1. Enable GPU Acceleration for `faster-whisper`
Currently, `whisper_service.py` hardcodes the CPU device: 
`WhisperModel(WHISPER_MODEL_SIZE, device="cpu", compute_type="int8")`

**Recommendation:** `Architecture.md` notes that `faster-whisper` can be GPU-accelerated. You should update this to dynamically detect if a GPU (CUDA) is available, falling back to CPU if it isn't. This will significantly decrease transcription latency for local inference.

### ✅ [COMPLETED] 2. Make Transcription Asynchronous (Non-Blocking)
Currently, `_groq_transcribe` and `_local_transcribe` are fully synchronous, meaning they block the main FastAPI thread while waiting for the network or CPU processing.

**Recommendation:** `Architecture.md` suggests considering asynchronous background tasks for transcription to avoid blocking the main server. You should use `httpx.AsyncClient` for the Groq network call, and run the local `faster-whisper` model in a thread pool (e.g., using `asyncio.to_thread`) so the main server can concurrently handle other incoming requests.

### ✅ [COMPLETED] 3. Replace `print()` with Structured Logging and Metrics
Currently, the service relies on basic print statements (e.g., `print(f"[Whisper] Groq attempt...")`) for monitoring.

**Recommendation:** `Architecture.md` explicitly calls for using Python's `logging` module for structured logging. It also suggests adding metrics tracking for key events, such as transcription processing time and API error rates, to improve observability.

### ✅ [COMPLETED] 4. Application Startup Pre-loading
Currently, the local model is lazy-loaded (`_local_model = None`) upon the first transcription request.

**Recommendation:** Lazy loading causes a massive latency spike on the very first user request while the model loads into memory, which violates the low-latency goal of the MVP. Update FastAPI's lifespan events in `main.py` to trigger the model loading in the background as soon as the server starts up.
