"use client";

import React, { useState, useRef } from "react";
import {
  X,
  Send,
  Bot,
  Sparkles,
  HelpCircle,
  Paperclip,
  FileText,
  Image as ImageIcon,
  FlaskConical,
} from "lucide-react";
import { ChatMessage, ParcelAnalysisResponse, ChatAttachment } from "@/lib/types";
import { sendChatMessage } from "@/lib/api";
import ReactMarkdown from "react-markdown";
import { useLanguage } from "@/i18n/LanguageContext";

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
  const { t, language } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init-1",
      sender: "ai",
      text: t.chat.initGreeting,
      timestamp: "00:00",
    },
  ]);

  const [inputValue, setInputValue] = useState("");
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (file.size > 15 * 1024 * 1024) {
        alert(`Fișierul "${file.name}" depășește limita de 15MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64Content = result.split(",")[1];
        const previewUrl = file.type.startsWith("image/") ? result : undefined;

        setAttachments((prev) => [
          ...prev,
          {
            name: file.name,
            content_type: file.type || "application/octet-stream",
            data_base64: base64Content,
            preview_url: previewUrl,
            size_kb: Math.round(file.size / 1024),
          },
        ]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async (textToSend?: string) => {
    const message = textToSend !== undefined ? textToSend : inputValue;
    if ((!message.trim() && attachments.length === 0) || isLoading) return;

    const currentAttachments = [...attachments];
    setAttachments([]);
    setInputValue("");
    setIsLoading(true);

    const userText =
      message.trim() ||
      (currentAttachments.length > 0
        ? `Vă rog să analizați buletinul / fișierele atașate (${currentAttachments.map((a) => a.name).join(", ")}) și să oferiți concluzii agronomice concrete.`
        : "");

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: userText,
      attachments: currentAttachments.length > 0 ? currentAttachments : undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);

    try {
      const reply = await sendChatMessage(
        analysis.parcel_id,
        userText,
        {
          soil_profile: analysis.soil_profile,
          climate_telemetry: analysis.climate_telemetry,
        },
        currentAttachments
      );

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error("Eroare trimitere mesaj chat:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const QUICK_QUESTIONS =
    language === "ru"
      ? [
          "Какую дозу азота (N) рекомендуете?",
          "Как защитить культуру от засухи?",
          "Интерпретация анализа почвы",
          "Какой севооборот на следующий год?",
        ]
      : language === "en"
      ? [
          "What nitrogen (N) rate do you recommend?",
          "How to protect the crop against drought?",
          "Interpret soil lab test results",
          "Recommended crop rotation for next year?",
        ]
      : [
          "Ce cantitate de azot (N) recomanzi?",
          "Cum protejez cultura de secetă?",
          "Interpretare buletin analiză sol",
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
                <h3 className="text-base font-extrabold tracking-tight text-slate-900">{t.chat.title}</h3>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-emerald-700">
                  Multimodal 3.8
                </span>
              </div>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.14)]" />
                {t.chat.online}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-400 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
            aria-label="Închide"
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
                {/* Render Attachments in User Bubble */}
                {m.attachments && m.attachments.length > 0 && (
                  <div className="mb-2 space-y-2">
                    {m.attachments.map((att, idx) => (
                      <div key={idx} className="rounded-xl overflow-hidden">
                        {att.content_type.startsWith("image/") && att.preview_url ? (
                          <div className="rounded-xl overflow-hidden border border-white/20 bg-black/10">
                            <img
                              src={att.preview_url}
                              alt={att.name}
                              className="max-h-52 w-auto object-cover rounded-lg cursor-pointer hover:opacity-95 transition"
                              onClick={() => {
                                const w = window.open("");
                                if (w) w.document.write(`<img src="${att.preview_url}" style="max-width:100%" />`);
                              }}
                            />
                            <div className="p-1.5 text-[11px] truncate opacity-90 flex items-center gap-1">
                              <ImageIcon className="w-3 h-3 shrink-0" />
                              <span className="truncate">{att.name}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 rounded-xl bg-white/20 p-2.5 backdrop-blur-xs text-xs">
                            <FileText className="h-5 w-5 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-bold">{att.name}</p>
                              {att.size_kb && (
                                <p className="text-[10px] opacity-75">{att.size_kb} KB</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Text Content */}
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

                <span
                  className={`mt-1.5 block text-right text-[10px] ${
                    m.sender === "user" ? "text-emerald-100" : "text-slate-400"
                  }`}
                >
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
              <span>Dr. Agro analizează datele și fișierele...</span>
            </div>
          )}
        </div>

        {/* Quick Questions */}
        <div className="chat-quick-section border-t border-slate-100 px-4 py-3 sm:px-6">
          <span className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.13em] text-slate-400">
            <HelpCircle className="h-3.5 w-3.5 text-emerald-600" /> Recomandări rapide
          </span>
          <div className="flex flex-wrap gap-2">
            {QUICK_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                className="chat-quick-button rounded-full border bg-white px-3 py-1.5 text-left text-[11px] font-medium text-slate-600 transition hover:border-emerald-300 hover:text-emerald-800"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar & Attachment Uploader */}
        <div className="chat-input-section border-t border-slate-100 px-4 py-3 sm:px-6 bg-slate-50/50">
          {/* Staged Attachments Preview */}
          {attachments.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {attachments.map((att, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/90 px-3 py-1.5 text-xs text-emerald-900 shadow-xs"
                >
                  {att.content_type.startsWith("image/") && att.preview_url ? (
                    <img
                      src={att.preview_url}
                      alt={att.name}
                      className="h-6 w-6 rounded object-cover border border-emerald-300"
                    />
                  ) : (
                    <FileText className="h-4 w-4 text-emerald-700" />
                  )}
                  <span className="max-w-[140px] truncate font-semibold">{att.name}</span>
                  {att.size_kb && (
                    <span className="text-[10px] text-emerald-700/80">({att.size_kb} KB)</span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeAttachment(idx)}
                    className="ml-1 rounded-full p-0.5 text-emerald-700 hover:bg-emerald-200"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="chat-input-shell flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-2 py-1.5 shadow-sm focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20"
          >
            {/* Hidden native file input */}
            <input
              type="file"
              ref={fileInputRef}
              multiple
              accept="image/*,application/pdf,.csv,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Paperclip Button for Attachments */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title={t.chat.attach}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 transition"
            >
              <Paperclip className="h-4 w-4" />
            </button>

            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={
                attachments.length > 0
                  ? (language === "ru" ? "Добавьте комментарий или отправьте..." : language === "en" ? "Add a message or send for analysis..." : "Adaugă un mesaj sau trimite pentru interpretare...")
                  : t.chat.placeholder
              }
              className="flex-1 bg-transparent px-2 py-1.5 text-sm text-slate-800 outline-none placeholder:text-slate-400"
            />

            <button
              type="submit"
              disabled={isLoading || (!inputValue.trim() && attachments.length === 0)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-700/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
              title={t.chat.send}
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
          <p className="mt-2 text-center text-[10px] text-slate-400">
            {t.chat.disclaimer}
          </p>
        </div>
      </div>
    </div>
  );
};
