"use client";

import { useState, useRef } from "react";
import { Mic, Send, Paperclip, StopCircle, User } from "lucide-react";

type Message = {
  id: string;
  sender: "user" | "bot";
  type: "text" | "voice";
  content: string;
  time: string;
};

const CONTACTS = [
  { name: "ABC Stores", phone: "+919876543210" },
  { name: "Sharma Kirana", phone: "+919876543211" },
  { name: "Hotel Sai Ram", phone: "+919876543212" },
  { name: "Mehta Grocers", phone: "+919876543213" },
  { name: "Green Leaf Deli", phone: "+919876543214" },
];

export default function SimulatorPage() {
  const [activeContact, setActiveContact] = useState(CONTACTS[0]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleSendMessage = async (text: string, audioBlob?: Blob) => {
    if (!text.trim() && !audioBlob) return;

    // Optimistic UI for user message
    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      type: audioBlob ? "voice" : "text",
      content: audioBlob ? "Voice Note" : text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsSending(true);

    try {
      const formData = new FormData();
      formData.append("customer_name", activeContact.name);
      formData.append("customer_phone", activeContact.phone);
      
      if (audioBlob) {
        formData.append("audio", audioBlob, "voicenote.webm");
      } else {
        formData.append("body", text);
      }

      const res = await fetch("http://localhost:8000/api/simulator/message", {
        method: "POST",
        body: formData,
      });
      
      const data = await res.json();
      
      // Bot reply
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        type: "text",
        content: data.reply || "Error: No reply received",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);

    } catch (err) {
      console.error("Error sending message:", err);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        type: "text",
        content: "Error connecting to AI Server.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

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
        handleSendMessage("", audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access denied or error:", err);
      alert("Could not access microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#ece5dd] font-sans">
      {/* Left Sidebar */}
      <div className="w-1/3 bg-white border-r border-gray-300 flex flex-col">
        <div className="bg-[#f0f2f5] h-16 flex items-center px-4 font-bold text-gray-700">
          WhatsApp Simulator
        </div>
        <div className="flex-1 overflow-y-auto">
          {CONTACTS.map((contact) => (
            <div
              key={contact.phone}
              onClick={() => {
                setActiveContact(contact);
                setMessages([]); // clear chat on switch
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
      <div className="flex-1 flex flex-col relative" style={{ backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')", backgroundRepeat: 'repeat' }}>
        {/* Chat Header */}
        <div className="bg-[#f0f2f5] h-16 flex items-center px-4 border-l border-gray-300 z-10">
          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-500">
            <User size={20} />
          </div>
          <div className="ml-4">
            <div className="font-bold text-gray-800">{activeContact.name}</div>
            <div className="text-xs text-gray-500">online</div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex justify-center">
            <div className="bg-[#e1f3fb] text-gray-600 text-xs py-1 px-3 rounded-lg shadow-sm">
              Today
            </div>
          </div>
          
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[70%] rounded-lg p-2 shadow-sm ${msg.sender === "user" ? "bg-[#dcf8c6] rounded-tr-none" : "bg-white rounded-tl-none"}`}>
                <div className="text-sm text-gray-800 whitespace-pre-wrap">{msg.content}</div>
                <div className="text-[10px] text-gray-500 text-right mt-1">
                  {msg.time}
                </div>
              </div>
            </div>
          ))}
          {isSending && (
            <div className="flex justify-start">
              <div className="bg-white rounded-lg p-2 rounded-tl-none shadow-sm text-sm text-gray-500 italic">
                SupplySetu AI is typing...
              </div>
            </div>
          )}
        </div>

        {/* Chat Input Bar */}
        <div className="bg-[#f0f2f5] p-3 flex items-center space-x-2 z-10">
          <button className="text-gray-500 p-2">
            <Paperclip size={24} />
          </button>
          
          <input
            type="text"
            className="flex-1 bg-white rounded-full px-4 py-2 focus:outline-none"
            placeholder="Type a message or use voice note..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage(inputText)}
            disabled={isRecording || isSending}
          />
          
          {inputText.trim() ? (
            <button 
              onClick={() => handleSendMessage(inputText)}
              disabled={isSending}
              className="bg-[#00a884] text-white p-2 rounded-full hover:bg-[#008f6f]"
            >
              <Send size={20} />
            </button>
          ) : (
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`p-2 rounded-full text-white transition-colors ${
                isRecording ? "bg-red-500 hover:bg-red-600 animate-pulse" : "bg-[#00a884] hover:bg-[#008f6f]"
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
