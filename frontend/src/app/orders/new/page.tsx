"use client";
// Force Vercel to rebuild frontend

import { useState, useRef } from "react";
import { Mic, Check, RotateCcw, Save, Loader2, ArrowLeft, Type, AlertCircle } from "lucide-react";

type Step = "idle" | "recording" | "uploading" | "transcribing" | "extracting" | "review" | "done" | "error";
type InputMode = "voice" | "text";

const EXAMPLE_ORDERS = [
  "20 kg tamatar aur 15 kg pyaz kal subah bhejna",
  "50 kg potato, 10 kg garlic, 5 kg ginger needed tomorrow",
  "Bhaiya 2 dozen palak aur 3 kg methi chahiye parso tak",
];

export default function NewOrderPage() {
  const [mode, setMode] = useState<InputMode>("voice");
  const [step, setStep] = useState<Step>("idle");
  const [transcript, setTranscript] = useState("");
  const [typedText, setTypedText] = useState("");
  const [extractedData, setExtractedData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Voice Recording ────────────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((t) => t.stop());
        if (timerRef.current) clearInterval(timerRef.current);
        processAudio(blob);
      };

      setRecordingSeconds(0);
      timerRef.current = setInterval(() => setRecordingSeconds((s) => s + 1), 1000);

      mediaRecorder.start();
      setStep("recording");
    } catch {
      setErrorMsg("Microphone access denied. Please allow microphone access or use text input instead.");
      setStep("error");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && step === "recording") {
      mediaRecorderRef.current.stop();
      setStep("uploading");
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const processAudio = async (blob: Blob) => {
    const MIN_BYTES = 1024;
    if (blob.size < MIN_BYTES) {
      setErrorMsg("Recording was too short. Please hold the button and speak clearly.");
      setStep("error");
      return;
    }

    const formData = new FormData();
    formData.append("file", blob, "voicenote.webm");

    try {
      setStep("transcribing");
      const resT = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/transcribe`, {
        method: "POST",
        body: formData,
      });
      if (!resT.ok) throw new Error(`Transcription failed: ${resT.status}`);
      const dataT = await resT.json();
      await extractFromText(dataT.transcript);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Error processing audio. Please try again.");
      setStep("error");
    }
  };

  // ── Text Processing ────────────────────────────────────────────────────
  const processText = async () => {
    const text = typedText.trim();
    if (!text) return;
    await extractFromText(text);
  };

  // ── Shared: LLM extraction ─────────────────────────────────────────────
  const extractFromText = async (text: string) => {
    setTranscript(text);
    setStep("extracting");
    try {
      const resE = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/transcribe/extract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: text }),
      });
      if (!resE.ok) throw new Error(`Extraction failed: ${resE.status}`);
      const dataE = await resE.json();
      setExtractedData(dataE);
      setStep("review");
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "AI extraction failed. Please try again.");
      setStep("error");
    }
  };

  // ── Save order ─────────────────────────────────────────────────────────
  const saveOrder = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: extractedData?.customer || "Unknown Customer",
          source: mode === "voice" ? "manual_voice" : "manual_text",
          items: extractedData?.items || [],
          notes: extractedData?.notes,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      setStep("done");
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to save order. Please try again.");
      setStep("error");
    }
  };

  const reset = () => {
    setStep("idle");
    setTranscript("");
    setTypedText("");
    setExtractedData(null);
    setErrorMsg("");
    setRecordingSeconds(0);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 font-sans px-4">
      {/* Back link */}
      <div className="w-full max-w-2xl mb-4">
        <a href="/orders" className="inline-flex items-center space-x-2 text-gray-500 hover:text-green-700 transition-colors text-sm font-medium">
          <ArrowLeft size={16} />
          <span>Back to Orders</span>
        </a>
      </div>

      <h1 className="text-3xl font-bold text-gray-800 mb-2">New Order</h1>
      <p className="text-gray-500 mb-8 text-sm">Speak or type your order — AI will extract the details</p>

      {/* Mode Toggle Tabs */}
      {(step === "idle" || step === "recording") && (
        <div className="flex bg-gray-200 rounded-xl p-1 mb-6 w-full max-w-2xl">
          <button
            onClick={() => { setMode("voice"); reset(); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-sm transition-all ${
              mode === "voice" ? "bg-white text-green-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Mic size={16} />
            Voice Note
          </button>
          <button
            onClick={() => { setMode("text"); reset(); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-sm transition-all ${
              mode === "text" ? "bg-white text-green-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Type size={16} />
            Type Order
          </button>
        </div>
      )}

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 w-full max-w-2xl">

        {/* ── VOICE MODE ── */}
        {mode === "voice" && (step === "idle" || step === "recording") && (
          <div className="text-center">
            <div className={`mx-auto w-32 h-32 rounded-full flex items-center justify-center transition-all mb-6 ${
              step === "recording" ? "bg-red-100 ring-8 ring-red-200 animate-pulse" : "bg-green-100"
            }`}>
              <Mic size={48} className={step === "recording" ? "text-red-500" : "text-green-600"} />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-1">
              {step === "recording" ? `Listening… ${formatTime(recordingSeconds)}` : "Tap to Speak"}
            </h2>
            <p className="text-gray-400 text-sm mb-8 italic">
              "Kal subah 20 kilo tamatar aur 15 kilo pyaz bhejna"
            </p>
            <button
              onClick={step === "recording" ? stopRecording : startRecording}
              className={`px-8 py-3 rounded-full text-white font-bold text-lg shadow-lg hover:opacity-90 transition-all ${
                step === "recording" ? "bg-red-500 scale-95" : "bg-green-600"
              }`}
            >
              {step === "recording" ? "Stop Recording" : "Start Recording"}
            </button>
          </div>
        )}

        {/* ── TEXT MODE ── */}
        {mode === "text" && step === "idle" && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Type your order in any language
            </label>
            <textarea
              value={typedText}
              onChange={(e) => setTypedText(e.target.value)}
              rows={5}
              placeholder={"e.g. \"20 kg tamatar aur 10 kg pyaz parso chahiye\"\nor \"50 kg potato, 5 kg garlic needed tomorrow morning\""}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 resize-none text-sm leading-relaxed font-noto-sans"
            />

            {/* Quick-fill examples */}
            <div className="mt-3 mb-6">
              <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">Quick examples</p>
              <div className="flex flex-wrap gap-2">
                {EXAMPLE_ORDERS.map((ex, i) => (
                  <button
                    key={i}
                    onClick={() => setTypedText(ex)}
                    className="text-xs bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 px-3 py-1.5 rounded-full transition-colors truncate max-w-[260px]"
                    title={ex}
                  >
                    {ex.length > 40 ? ex.slice(0, 38) + "…" : ex}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={processText}
              disabled={!typedText.trim()}
              className="w-full py-3 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <Mic size={18} />
              Extract Order with AI
            </button>
          </div>
        )}

        {/* ── LOADING ── */}
        {(step === "uploading" || step === "transcribing" || step === "extracting") && (
          <div className="flex flex-col items-center py-12 text-center">
            <Loader2 size={48} className="text-green-600 animate-spin mb-6" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              {step === "uploading" ? "Uploading audio…"
                : step === "transcribing" ? "Converting speech to text…"
                : "AI is reading your order…"}
            </h2>
            <p className="text-gray-400 text-sm">This usually takes a few seconds.</p>
          </div>
        )}

        {/* ── REVIEW ── */}
        {step === "review" && (
          <div className="text-left">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Review Extracted Order</h2>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
                {mode === "voice" ? "Transcribed Text" : "Your Input"}
              </h3>
              <p className="text-gray-800 font-medium font-noto-sans leading-relaxed">{transcript}</p>
            </div>

            {extractedData?.items?.length > 0 ? (
              <div className="bg-green-50 p-6 rounded-xl border border-green-200 mb-8">
                <h3 className="text-xs font-bold text-green-700 uppercase tracking-wide mb-4">Extracted Items</h3>
                <div className="space-y-3">
                  {extractedData.customer && extractedData.customer !== "Unknown" && (
                    <div className="flex justify-between items-center border-b border-green-200 pb-2">
                      <span className="text-gray-500 text-sm">Customer</span>
                      <span className="font-bold text-gray-800">{extractedData.customer}</span>
                    </div>
                  )}
                  {extractedData.items.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between items-center border-b border-green-100 pb-2">
                      <span className="text-gray-700 capitalize font-medium">{item.product_name}</span>
                      <span className="font-bold text-green-700 bg-green-100 px-3 py-0.5 rounded-full text-sm">
                        {item.quantity} {item.unit}
                      </span>
                    </div>
                  ))}
                  {extractedData.delivery_date && (
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-gray-500 text-sm">Delivery</span>
                      <span className="font-semibold text-gray-700">{extractedData.delivery_date}</span>
                    </div>
                  )}
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <div className="h-1.5 flex-1 bg-green-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${Math.round((extractedData.confidence || 0.9) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-green-600 font-semibold">
                    {Math.round((extractedData.confidence || 0.9) * 100)}% confidence
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 mb-8 text-center">
                <p className="text-orange-700 font-medium mb-1">No items detected</p>
                <p className="text-orange-500 text-sm">Please retry with item names and quantities.</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={reset}
                className="flex-1 px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors"
              >
                <RotateCcw size={18} /> Retry
              </button>
              <button
                onClick={saveOrder}
                disabled={!extractedData?.items?.length}
                className="flex-1 px-6 py-3 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                <Save size={18} /> Save Order
              </button>
            </div>
          </div>
        )}

        {/* ── ERROR ── */}
        {step === "error" && (
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle size={32} className="text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Something went wrong</h2>
            <p className="text-gray-500 text-sm mb-6">{errorMsg}</p>
            <button
              onClick={reset}
              className="px-6 py-2.5 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* ── DONE ── */}
        {step === "done" && (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <Check size={48} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Order Saved!</h2>
            <p className="text-gray-500 mb-8">Your order has been added to the dashboard.</p>
            <div className="flex justify-center gap-4">
              <a href="/dashboard" className="px-6 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition-colors">
                Go to Dashboard
              </a>
              <button onClick={reset} className="px-6 py-2.5 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 transition-colors">
                New Order
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
