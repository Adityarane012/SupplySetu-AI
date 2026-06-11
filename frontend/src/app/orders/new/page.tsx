"use client";

import { useState, useRef } from "react";
import { Mic, Check, RotateCcw, Save, Loader2 } from "lucide-react";

export default function NewOrderVoicePage() {
  const [step, setStep] = useState<"idle" | "recording" | "uploading" | "transcribing" | "extracting" | "review" | "done">("idle");
  const [transcript, setTranscript] = useState("");
  const [extractedData, setExtractedData] = useState<any>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setStep("recording");
    } catch (err) {
      console.error("Microphone error:", err);
      alert("Could not access microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && step === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  const processAudio = async (blob: Blob) => {
    setStep("uploading");
    const formData = new FormData();
    formData.append("file", blob, "voicenote.webm");

    try {
      setStep("transcribing");
      const resTranscribe = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/transcribe`, {
        method: "POST",
        body: formData,
      });
      const dataTranscribe = await resTranscribe.json();
      setTranscript(dataTranscribe.transcript);

      setStep("extracting");
      const resExtract = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/transcribe/extract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: dataTranscribe.transcript }),
      });
      const dataExtract = await resExtract.json();
      setExtractedData(dataExtract);
      setStep("review");
    } catch (err) {
      console.error("Pipeline error:", err);
      alert("Error processing audio");
      setStep("idle");
    }
  };

  const saveOrder = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: extractedData.customer || "Unknown Voice Customer",
          source: "manual_voice",
          items: extractedData.items || [],
        }),
      });
      setStep("done");
    } catch (err) {
      console.error("Error saving order:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 font-sans">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">New Voice Order</h1>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 w-full max-w-2xl text-center">
        {/* Step 1: Record */}
        {step === "idle" || step === "recording" ? (
          <div>
            <div className="mb-6">
              <div className={`mx-auto w-32 h-32 rounded-full flex items-center justify-center transition-all ${step === "recording" ? "bg-red-100 animate-pulse" : "bg-green-100"}`}>
                <Mic size={48} className={step === "recording" ? "text-red-500" : "text-green-600"} />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              {step === "recording" ? "Listening..." : "Tap to Speak"}
            </h2>
            <p className="text-gray-500 mb-8">
              "Kal subah 20 kilo tamatar aur 15 kilo pyaz bhejna"
            </p>
            <button
              onClick={step === "recording" ? stopRecording : startRecording}
              className={`px-8 py-3 rounded-full text-white font-bold text-lg shadow-lg hover:opacity-90 transition-opacity ${step === "recording" ? "bg-red-500" : "bg-green-600"}`}
            >
              {step === "recording" ? "Stop Recording" : "Start Recording"}
            </button>
          </div>
        ) : step === "uploading" || step === "transcribing" || step === "extracting" ? (
          <div className="flex flex-col items-center py-12">
            <Loader2 size={48} className="text-green-600 animate-spin mb-6" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              {step === "uploading" ? "Uploading audio..." : 
               step === "transcribing" ? "Converting speech to text..." : 
               "AI is extracting order details..."}
            </h2>
            <p className="text-gray-500">This usually takes a few seconds.</p>
          </div>
        ) : step === "review" ? (
          <div className="text-left">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Review Extracted Order</h2>
            
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6">
              <h3 className="text-sm font-bold text-gray-500 uppercase mb-2">Original Transcript</h3>
              <p className="text-gray-800 font-medium font-noto-sans">{transcript}</p>
            </div>

            <div className="bg-green-50 p-6 rounded-xl border border-green-200 mb-8">
              <h3 className="text-sm font-bold text-green-700 uppercase mb-4">Structured Data</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-green-200 pb-2">
                  <span className="text-gray-600">Customer</span>
                  <span className="font-bold text-gray-800">{extractedData?.customer || "Unknown"}</span>
                </div>
                {extractedData?.items?.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between items-center border-b border-green-200 pb-2">
                    <span className="text-gray-600 capitalize">{item.product_name}</span>
                    <span className="font-bold text-gray-800">{item.quantity} {item.unit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between gap-4">
              <button 
                onClick={() => setStep("idle")}
                className="flex-1 px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                <RotateCcw size={20} /> Retake
              </button>
              <button 
                onClick={saveOrder}
                className="flex-1 px-6 py-3 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 flex items-center justify-center gap-2 shadow-sm"
              >
                <Save size={20} /> Save Order
              </button>
            </div>
          </div>
        ) : (
          <div className="py-12">
            <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <Check size={48} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Order Saved!</h2>
            <p className="text-gray-500 mb-8">Your voice order has been added to the dashboard.</p>
            <div className="flex justify-center gap-4">
               <a href="/dashboard" className="px-6 py-2 rounded-lg bg-gray-100 text-gray-700 font-bold hover:bg-gray-200">Go to Dashboard</a>
               <button onClick={() => setStep("idle")} className="px-6 py-2 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700">New Order</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
