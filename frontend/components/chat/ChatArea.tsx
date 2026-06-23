"use client";
import { useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ACCENT_COLORS, DENSITY_MAP, CHAT_WIDTH_MAP } from "@/utils/theme";
import { Chat, Theme, BubbleStyle, MessageDensity, ChatWidth } from "@/types";

type ChatAreaProps = {
  activeChat: Chat | undefined;
  handleNewChat: () => void;

  // Input & Messaging State
  input: string;
  setInput: (val: string) => void;
  pendingFiles: string[];
  replyTo: string | null;
  setReplyTo: (val: string | null) => void;
  isTyping: boolean;

  // Handlers
  handleSend: () => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeFile: (index: number) => void;
  handleReply: (content: string) => void;

  // Layout & UI State
  sidebarOpen: boolean;
  setSidebarOpen: (val: boolean | ((prev: boolean) => boolean)) => void;
  theme: Theme;
  highContrast: boolean;
  fontSize: number;
  fontFamily: string;
  lineSpacing: number;
  accentIndex: number;
  bubbleStyle: BubbleStyle;
  messageDensity: MessageDensity;
  chatWidth: ChatWidth;
};

export default function ChatArea(props: ChatAreaProps) {
  const {
    activeChat, handleNewChat,
    input, setInput, pendingFiles, replyTo, setReplyTo, isTyping,
    handleSend, handleFileUpload, removeFile, handleReply,
    sidebarOpen, setSidebarOpen,
    theme, highContrast, fontSize, fontFamily, lineSpacing,
    accentIndex, bubbleStyle, messageDensity, chatWidth
  } = props;

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const accent = ACCENT_COLORS[accentIndex];
  const density = DENSITY_MAP[messageDensity];
  const bubbleRadius = bubbleStyle === "rounded" ? "rounded-2xl" : "rounded-md";

  // Re-calculate the theme classes for the chat area
  const t = {
    cardBg:        theme === "dark" ? (highContrast ? "bg-black"     : "bg-stone-900")  : (highContrast ? "bg-white"      : "bg-white"),
    inputBg:       theme === "dark" ? (highContrast ? "bg-black"     : "bg-stone-800")  : (highContrast ? "bg-white"      : "bg-stone-50"),
    bubbleBot:     theme === "dark" ? (highContrast ? "bg-black"     : "bg-stone-800")  : (highContrast ? "bg-white"      : "bg-white"),
    border:        theme === "dark" ? (highContrast ? "border-white" : "border-stone-800") : (highContrast ? "border-black" : "border-stone-300"),
    borderMid:     theme === "dark" ? (highContrast ? "border-white" : "border-stone-700") : (highContrast ? "border-black" : "border-stone-300"),
    textPrimary:   theme === "dark" ? (highContrast ? "text-white"   : "text-stone-100") : (highContrast ? "text-black"   : "text-stone-900"),
    textSecondary: theme === "dark" ? (highContrast ? "text-white"   : "text-stone-300") : (highContrast ? "text-black"   : "text-stone-600"),
    textMuted:     theme === "dark" ? (highContrast ? "text-white"   : "text-stone-500") : (highContrast ? "text-black"   : "text-stone-400"),
    textBubbleBot: theme === "dark" ? (highContrast ? "text-white"   : "text-stone-100") : (highContrast ? "text-black"   : "text-stone-800"),
  };

  // Auto-scroll to bottom when messages update or bot is typing
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat?.messages, isTyping]);

  return (
    <div className="flex-1 flex flex-col items-center min-w-0">

      {/* Top Bar */}
      <div className={`w-full flex items-center px-4 py-3 border-b ${t.border}`}>
        <button onClick={() => setSidebarOpen((prev) => !prev)} className={`${t.textMuted} hover:${accent.text} transition-colors text-xl mr-3`}>
          ☰
        </button>
        {!sidebarOpen && <span className={`${accent.text} font-semibold`}>BIM Chatbot</span>}
      </div>

      {!activeChat ? (
        /* Empty State (No Chat Selected) */
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4">
          <div className="text-center space-y-3">
            <div className="text-6xl mb-2">🏗️</div>
            <h2 className={`text-4xl font-bold ${accent.text}`}>Welcome to BIM Chatbot</h2>
            <p className={t.textMuted}>Your AI assistant for BIM documentation.</p>
          </div>
          <div className={`grid grid-cols-1 gap-3 w-full max-w-md ${t.textMuted}`}>
            {["🔍 Search and retrieve BIM documents instantly", "📄 Summarise long technical reports", "✅ Check compliance against BIM standards"].map((item) => (
              <div key={item} className={`${t.cardBg} border ${t.border} hover:${accent.border} rounded-xl px-4 py-3 transition-colors`}>{item}</div>
            ))}
          </div>
          <button onClick={handleNewChat} className={`${accent.bg} ${accent.hover} text-stone-950 px-6 py-3 rounded-xl font-semibold transition-colors`}>
            + Start a New Chat
          </button>
        </div>
      ) : (
        /* Active Chat State */
        <>
          <div className={`flex-1 overflow-y-auto py-6 ${density.gap} w-full ${CHAT_WIDTH_MAP[chatWidth]} px-4`}>
            {activeChat.messages.length === 0 && !isTyping && (
              <p className={`text-center ${t.textMuted} mt-20`}>Ask me anything about your BIM documents.</p>
            )}

            {/* Messages Array */}
            {activeChat.messages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>

                {/* Reply Context */}
                {msg.replyTo && (
                  <div className={`max-w-lg ${density.px} py-2 rounded-xl ${t.textMuted} ${t.inputBg} border-l-2 ${accent.border} mb-1 truncate ${msg.role === "user" ? "self-end" : "self-start"}`} style={{ fontSize: `${Math.max(fontSize - 2, 10)}px` }}>
                    ↩ {msg.replyTo}
                  </div>
                )}

                {/* Message Bubble */}
                <div className={`max-w-lg ${density.px} ${density.py} ${bubbleRadius} overflow-x-auto ${msg.role === "user" ? `${accent.bg} text-stone-950 font-medium` : `${t.bubbleBot} ${t.textBubbleBot}`}`}>

                  {/* File Attachments */}
                  {msg.fileNames && msg.fileNames.length > 0 && (
                    <div className="mb-2 space-y-1">
                      {msg.fileNames.map((name, fi) => (
                        <p key={fi} className="font-medium opacity-80" style={{ fontSize: `${Math.max(fontSize - 2, 10)}px` }}>📎 {name}</p>
                      ))}
                    </div>
                  )}

                  {/* MAGIC FIX: Translate Markdown to real UI! */}
{/* MAGIC FIX: Translate Markdown to real UI! */}
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown remarkPlugins={[remarkGfm as any]}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    msg.content
                  )}

                </div>
                
                {/* Timestamp & Actions */}
                <div className="flex items-center gap-2 mt-1 px-1">
                  <span className={t.textMuted} style={{ fontSize: `${Math.max(fontSize - 2, 10)}px` }}>{msg.timestamp}</span>
                  <button onClick={() => { handleReply(msg.content); setTimeout(() => inputRef.current?.focus(), 0); }} className={`${t.textMuted} hover:${t.textPrimary} transition-colors`} style={{ fontSize: `${Math.max(fontSize - 2, 10)}px` }} title="Reply">↩</button>
                </div>
              </div>
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-start">
                <div className={`${t.bubbleBot} px-4 py-3 ${bubbleRadius} flex gap-1 items-center`}>
                  <span className={`w-2 h-2 ${accent.bg} rounded-full animate-bounce`} style={{ animationDelay: "0ms" }} />
                  <span className={`w-2 h-2 ${accent.bg} rounded-full animate-bounce`} style={{ animationDelay: "150ms" }} />
                  <span className={`w-2 h-2 ${accent.bg} rounded-full animate-bounce`} style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            
            {/* Scroll Target */}
            <div ref={bottomRef} />
          </div>

          {/* Input Area */}
          <div className={`w-full ${CHAT_WIDTH_MAP[chatWidth]} px-4 py-4 border-t ${t.border} space-y-2`}>
            
            {/* Replying Banner */}
            {replyTo && (
              <div className={`flex items-center gap-2 ${t.inputBg} rounded-xl px-3 py-2 ${t.textMuted} border-l-2 ${accent.border}`}>
                <span className="flex-1 truncate">↩ Replying to: {replyTo}</span>
                <button onClick={() => setReplyTo(null)} className={`${t.textMuted} hover:text-red-400`} style={{ fontSize: `${Math.max(fontSize - 2, 10)}px` }}>✕</button>
              </div>
            )}
            
            {/* Pending Files Banner */}
            {pendingFiles.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {pendingFiles.map((name, i) => (
                  <div key={i} className={`flex items-center gap-2 ${t.inputBg} border ${t.borderMid} rounded-xl px-3 py-1 ${t.textSecondary}`}>
                    <span>📎 {name}</span>
                    <button onClick={() => removeFile(i)} className={`${t.textMuted} hover:text-red-400`} style={{ fontSize: `${Math.max(fontSize - 2, 10)}px` }}>✕</button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Main Input Row */}
            <div className="flex gap-2 items-center">
              <label className={`cursor-pointer ${t.inputBg} ${t.textMuted} px-3 py-2 rounded-xl font-medium transition-colors border ${t.borderMid}`}>
                📎
                <input type="file" multiple accept=".pdf,.dwg,.rvt,.ifc,.nwc,.nwd,.dxf,.xlsx,.xls,.csv,.docx,.doc,.txt,.json,.xml,.jpg,.jpeg,.png" className="hidden" onChange={(e) => { handleFileUpload(e); setTimeout(() => inputRef.current?.focus(), 0); }} />
              </label>
              
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={replyTo ? "Type your reply..." : pendingFiles.length > 0 ? "Add a message or just press Send..." : "Ask something about your BIM documents..."}
                className={`flex-1 ${t.inputBg} ${t.textPrimary} rounded-xl px-3 py-2 outline-none border ${t.borderMid} focus:${accent.border} transition-colors`}
              />
              
              <button onClick={handleSend} disabled={isTyping} className={`${accent.bg} ${accent.hover} text-stone-950 px-4 py-2 rounded-xl font-semibold disabled:opacity-50 transition-colors`}>
                Send
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}