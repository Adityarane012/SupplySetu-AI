"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, Send, StopCircle, User, ArrowLeft, AlertCircle } from "lucide-react";

type Message = {
  id: string;
  sender: "user" | "bot";
  type: "text" | "voice";
  content: string;
  time: string;
  duration?: number; // seconds, for voice messages
};

const CONTACTS = [
  { name: "ABC Stores", phone: "+919876543210" },
  { name: "Sharma Kirana", phone: "+919876543211" },
  { name: "Hotel Sai Ram", phone: "+919876543212" },
  { name: "Mehta Grocers", phone: "+919876543213" },
  { name: "Green Leaf Deli", phone: "+919876543214" },
];

/** Render *bold* and _italic_ markdown in bot replies */
function renderMarkdown(text: string) {
  const parts = text.split(/(\*[^*]+\*|_[^_]+_)/g);
  return parts.map((part, i) => {
    if (part.startsWith("*") && part.endsWith("*")) {
      return <strong key={i}>{part.slice(1, -1)}</strong>;
    }
    if (part.startsWith("_") && part.endsWith("_")) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return <span key={i}>{part}</span>;
  });
}

/** Format seconds as mm:ss */
function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function SimulatorPage() {
  const [activeContact, setActiveContact] = useState(CONTACTS[0]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [backendMissing, setBackendMissing] = useState(!BACKEND_URL);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sendingRef = useRef(false); // debounce guard

  // Auto-scroll to newest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, []);

  const addBotMessage = useCallback((content: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        type: "text",
        content,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  }, []);

  const handleSendMessage = useCallback(
    async (text: string, audioBlob?: Blob, audioDuration?: number) => {
      if (!text.trim() && !audioBlob) return;
      // Fix #2: debounce — prevent double-send
      if (sendingRef.current) return;
      sendingRef.current = true;
      setIsSending(true);

      // Optimistic user message
      const userMsg: Message = {
        id: Date.now().toString(),
        sender: "user",
        type: audioBlob ? "voice" : "text",
        content: audioBlob ? "Voice Note" : text,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        duration: audioDuration,
      };
      setMessages((prev) => [...prev, userMsg]);
      setInputText("");

      try {
        const formData = new FormData();
        formData.append("customer_name", activeContact.name);
        formData.append("customer_phone", activeContact.phone);

        if (audioBlob) {
          formData.append("audio", audioBlob, "voicenote.webm");
        } else {
          formData.append("body", text);
        }

        const res = await fetch(`${BACKEND_URL}/api/simulator/message`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          throw new Error(`Server error: ${res.status}`);
        }

        const data = await res.json();
        addBotMessage(data.reply || "No reply received.");
      } catch (err) {
        console.error("Error sending message:", err);
        addBotMessage(
          "❌ *Connection error.*\n\nCouldn't reach the AI server. Please check your connection and try again."
        );
      } finally {
        setIsSending(false);
        // Re-enable after short delay to prevent accidental double-tap
        setTimeout(() => { sendingRef.current = false; }, 800);
      }
    },
    [activeContact, addBotMessage]
  );

  const startRecording = async () => {
    // Fix #9: in-chat error instead of alert()
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const duration = recordingSeconds;
        stream.getTracks().forEach((t) => t.stop());
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        setRecordingSeconds(0);
        handleSendMessage("", audioBlob, duration);
      };

      // Fix #8: recording timer
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone error:", err);
      // Fix #9: in-chat message instead of alert()
      addBotMessage(
        "🎤 *Microphone access denied.*\n\nPlease allow microphone access in your browser settings, or type your order instead."
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Fix #10: backend URL missing banner
  if (backendMissing) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#ece5dd] font-sans">
        <div className="bg-white rounded-xl p-8 shadow-lg max-w-md text-center">
          <AlertCircle className="mx-auto mb-4 text-red-500" size={40} />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Backend Not Configured</h2>
          <p className="text-gray-500 text-sm">
            <code className="bg-gray-100 px-1 rounded">NEXT_PUBLIC_BACKEND_URL</code> is not set.
            Add it to your Vercel environment variables and redeploy.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#ece5dd] font-sans">
      {/* Left Sidebar */}
      <div className="w-1/3 bg-white border-r border-gray-300 flex flex-col">
        <div className="bg-[#f0f2f5] h-16 flex items-center px-4 font-bold text-gray-700 justify-between">
          <span>WhatsApp Simulator</span>
          <a href="/dashboard" className="text-xs text-green-600 hover:text-green-700 font-medium flex items-center space-x-1">
            <ArrowLeft size={14} />
            <span>Dashboard</span>
          </a>
        </div>
        <div className="flex-1 overflow-y-auto">
          {CONTACTS.map((contact) => (
            <div
              key={contact.phone}
              onClick={() => {
                setActiveContact(contact);
                setMessages([]);
              }}
              className={`flex items-center p-3 cursor-pointer border-b border-gray-100 hover:bg-[#f5f6f6] ${
                activeContact.phone === contact.phone ? "bg-[#ebebeb]" : ""
              }`}
            >
              <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-gray-500">
                <User size={24} />
              </div>
              <div className="ml-4">
                <div className="font-semibold text-gray-800">{contact.name}</div>
                <div className="text-sm text-gray-500">{contact.phone}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Chat Area */}
      <div
        className="flex-1 flex flex-col relative"
        style={{
          backgroundImage:
            "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')",
          backgroundRepeat: "repeat",
        }}
      >
        {/* Chat Header */}
        <div className="bg-[#f0f2f5] h-16 flex items-center px-4 border-l border-gray-300 z-10">
          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-500">
            <User size={20} />
          </div>
          <div className="ml-4">
            <div className="font-bold text-gray-800">{activeContact.name}</div>
            <div className="text-xs text-green-600">online</div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex justify-center">
            <div className="bg-[#e1f3fb] text-gray-600 text-xs py-1 px-3 rounded-lg shadow-sm">Today</div>
          </div>

          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[72%] rounded-lg p-2 shadow-sm ${
                  msg.sender === "user" ? "bg-[#dcf8c6] rounded-tr-none" : "bg-white rounded-tl-none"
                }`}
              >
                {/* Fix #6: voice bubble with icon + duration */}
                {msg.type === "voice" ? (
                  <div className="flex items-center space-x-2 px-1 py-0.5">
                    <div className="w-8 h-8 bg-[#00a884] rounded-full flex items-center justify-center">
                      <Mic size={16} className="text-white" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-700 font-medium">Voice Note</div>
                      {msg.duration != null && (
                        <div className="text-xs text-gray-500">{formatDuration(msg.duration)}</div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Fix #7: render *bold* and _italic_ markdown */
                  <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                    {msg.sender === "bot" ? renderMarkdown(msg.content) : msg.content}
                  </div>
                )}
                <div className="text-[10px] text-gray-400 text-right mt-1">{msg.time}</div>
              </div>
            </div>
          ))}

          {isSending && (
            <div className="flex justify-start">
              <div className="bg-white rounded-lg p-3 rounded-tl-none shadow-sm flex items-center space-x-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Chat Input Bar */}
        <div className="bg-[#f0f2f5] p-3 flex items-center space-x-2 z-10">
          <input
            type="text"
            className="flex-1 bg-white text-gray-800 placeholder-gray-400 rounded-full px-4 py-2 focus:outline-none text-sm"
            placeholder={isRecording ? `Recording… ${formatDuration(recordingSeconds)}` : "Type a message or use voice note…"}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !isSending && handleSendMessage(inputText)}
            disabled={isRecording || isSending}
          />

          {/* Fix #8: recording timer shown in placeholder + send/mic button */}
          {inputText.trim() ? (
            <button
              onClick={() => handleSendMessage(inputText)}
              disabled={isSending || isRecording}
              className="bg-[#00a884] text-white p-2 rounded-full hover:bg-[#008f6f] disabled:opacity-50 transition-colors"
            >
              <Send size={20} />
            </button>
          ) : (
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isSending}
              className={`p-2 rounded-full text-white transition-all disabled:opacity-50 ${
                isRecording
                  ? "bg-red-500 hover:bg-red-600 scale-110 ring-4 ring-red-200"
                  : "bg-[#00a884] hover:bg-[#008f6f]"
              }`}
            >
              {isRecording ? <StopCircle size={20} /> : <Mic size={20} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
