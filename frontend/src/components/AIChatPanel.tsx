"use client";

import React, { useState } from "react";
import { X, Send, Bot, Sparkles, HelpCircle } from "lucide-react";
import { ChatMessage, ParcelAnalysisResponse } from "@/lib/types";
import { sendChatMessage } from "@/lib/api";
import ReactMarkdown from "react-markdown";

interface AIChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: ParcelAnalysisResponse;
}

export const AIChatPanel: React.FC<AIChatPanelProps> = ({
  isOpen,
  onClose,
  analysis,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init-1",
      sender: "ai",
      text: `Salut! Sunt Dr. Agro, consultantul tău agronomic AI. Am analizat parcela ta cu suprafața de ${analysis.area_ha.toFixed(1)} ha și profilul de sol ${analysis.soil_profile.type}. Cu ce te pot ajuta legat de tehnologia culturilor, fertilizare sau asolament?`,
      timestamp: "Acum",
    },
  ]);

  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const message = textToSend || inputValue;
    if (!message.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: message,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    try {
      const reply = await sendChatMessage(analysis.parcel_id, message, {
        soil_profile: analysis.soil_profile,
        climate_telemetry: analysis.climate_telemetry,
      });

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const QUICK_QUESTIONS = [
    "Ce cantitate de azot (N) recomanzi?",
    "Cum protejez cultura de secetă?",
    "Ce asolament recomanzi pentru anul viitor?",
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/35 p-0 backdrop-blur-sm sm:p-4 md:p-6">
      <div className="chat-panel-enter chat-panel flex h-full w-full max-w-xl flex-col overflow-hidden rounded-none border border-white/70 bg-white sm:rounded-[28px]">
        {/* Header */}
        <div className="chat-panel-header relative flex items-center justify-between border-b border-emerald-100/80 px-5 py-4 sm:px-6">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-lime-400 to-emerald-700" />
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-lg shadow-emerald-700/20">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold tracking-tight text-slate-900">Dr. Agro AI</h3>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-emerald-700">AI</span>
              </div>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.14)]" />
                Consultant agronomic activ
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-400 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
            aria-label="Închide Consultant AI"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Messages List */}
        <div className="chat-messages flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-end gap-2.5 ${m.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {m.sender === "ai" && (
                <div className="chat-avatar flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
              )}
              <div
                className={`chat-bubble max-w-[85%] rounded-[20px] px-4 py-3 text-sm leading-6 ${
                  m.sender === "user"
                    ? "chat-bubble-user rounded-br-md text-white"
                    : "chat-bubble-ai rounded-bl-md text-slate-800"
                }`}
              >
                {m.sender === "ai" ? (
                  <div className="space-y-1.5 break-words">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => (
                          <p className="mb-2 last:mb-0 leading-relaxed text-slate-800">{children}</p>
                        ),
                        strong: ({ children }) => (
                          <strong className="font-extrabold text-slate-950">{children}</strong>
                        ),
                        em: ({ children }) => <em className="italic">{children}</em>,
                        h1: ({ children }) => (
                          <h3 className="mt-3 mb-1 text-base font-extrabold text-slate-950">{children}</h3>
                        ),
                        h2: ({ children }) => (
                          <h4 className="mt-2.5 mb-1 text-sm font-bold text-slate-950">{children}</h4>
                        ),
                        h3: ({ children }) => (
                          <h5 className="mt-2 mb-1 text-sm font-bold text-slate-900">{children}</h5>
                        ),
                        ul: ({ children }) => (
                          <ul className="my-2 ml-4 list-disc space-y-1 text-slate-700">{children}</ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="my-2 ml-4 list-decimal space-y-1 text-slate-700">{children}</ol>
                        ),
                        li: ({ children }) => <li className="leading-snug">{children}</li>,
                        blockquote: ({ children }) => (
                          <blockquote className="my-2 border-l-2 border-emerald-500 bg-emerald-50/60 py-1 pl-3 italic text-slate-700 rounded-r">
                            {children}
                          </blockquote>
                        ),
                        code: ({ children }) => (
                          <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs font-semibold text-emerald-800">
                            {children}
                          </code>
                        ),
                      }}
                    >
                      {m.text}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{m.text}</p>
                )}
                <span className={`mt-1.5 block text-right text-[10px] ${m.sender === "user" ? "text-emerald-100" : "text-slate-400"}`}>
                  {m.timestamp}
                </span>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2.5 px-1 py-2 text-xs font-medium text-slate-500">
              <div className="flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-2 text-emerald-700">
                <span className="chat-loading-dot" />
                <span className="chat-loading-dot [animation-delay:120ms]" />
                <span className="chat-loading-dot [animation-delay:240ms]" />
              </div>
              <span>Dr. Agro formulează recomandarea...</span>
            </div>
          )}
        </div>

        {/* Quick Questions */}
        <div className="chat-quick-section border-t border-slate-100 px-4 py-4 sm:px-6">
          <span className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.13em] text-slate-400">
            <HelpCircle className="h-3.5 w-3.5 text-emerald-600" /> Întrebări rapide
          </span>
          <div className="flex flex-wrap gap-2">
            {QUICK_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                className="chat-quick-button rounded-full border bg-white px-3 py-2 text-left text-[11px] font-medium text-slate-600 transition"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="chat-input-section border-t border-slate-100 px-4 py-4 sm:px-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="chat-input-shell flex items-center gap-2 rounded-2xl border px-2 py-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Întreabă despre parcelă, soiuri, riscuri..."
              className="flex-1 bg-transparent px-2.5 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
