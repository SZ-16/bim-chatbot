"use client";
import { useRef, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ACCENT_COLORS, DENSITY_MAP, CHAT_WIDTH_MAP } from "@/utils/theme";
import { Chat, Theme, BubbleStyle, MessageDensity, ChatWidth } from "@/types";

type ChatAreaProps = {
  activeChat: Chat | undefined;
  handleNewChat: () => void;
  input: string;
  setInput: (val: string) => void;
  pendingFiles: string[];
  replyTo: string | null;
  setReplyTo: (val: string | null) => void;
  isTyping: boolean;
  handleSend: () => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeFile: (index: number) => void;
  handleReply: (content: string) => void;
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

const InteractiveChart = ({ chartData, theme, highContrast }: { chartData: any, theme: string, highContrast: boolean }) => {
  if (!chartData || !chartData.labels || !chartData.values) return null;

  const data = chartData.labels.map((label: string, idx: number) => ({ name: label, value: chartData.values[idx] }));
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  const textColor = theme === "dark" ? (highContrast ? "#fff" : "#a8a29e") : "#444";
  const gridColor = theme === "dark" ? "#444" : "#e5e5e5";

  return (
    <div className="mt-8 w-full h-[350px]">
      <h4 className="text-center font-bold mb-6 text-stone-800 dark:text-stone-200">{chartData.title}</h4>
      <ResponsiveContainer width="100%" height="100%">
        {chartData.type === 'pie' ? (
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={{ fill: textColor, fontSize: 13 }}>
              {data.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <RechartsTooltip contentStyle={{ backgroundColor: theme==='dark'?'#1c1917':'#fff', borderColor: gridColor, borderRadius: '8px' }} />
          </PieChart>
        ) : (
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis dataKey="name" stroke={textColor} fontSize={13} tickLine={false} axisLine={false} />
            <YAxis stroke={textColor} fontSize={13} tickLine={false} axisLine={false} />
            <RechartsTooltip cursor={{ fill: theme==='dark'?'#292524':'#f5f5f4' }} contentStyle={{ backgroundColor: theme==='dark'?'#1c1917':'#fff', borderColor: gridColor, borderRadius: '8px' }} />
            <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={60} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

const TypewriterEffect = ({ text, animate }: { text: string; animate: boolean }) => {
  const [displayedText, setDisplayedText] = useState(animate ? "" : text);

  useEffect(() => {
    if (!animate) {
      setDisplayedText(text);
      return;
    }

    let i = 0;
    const timer = setInterval(() => {
      i += 3; // Number of characters to reveal per tick
      setDisplayedText(text.slice(0, i));
      if (i >= text.length) clearInterval(timer);
    }, 15);

    return () => clearInterval(timer);
  }, [text, animate]);

  return (
      <ReactMarkdown remarkPlugins={[remarkGfm as any]}>
        {displayedText}
      </ReactMarkdown>
  );
};

export default function ChatArea(props: ChatAreaProps) {
  const {
    activeChat, handleNewChat, input, setInput, pendingFiles, replyTo, setReplyTo, isTyping,
    handleSend, handleFileUpload, removeFile, handleReply, sidebarOpen, setSidebarOpen,
    theme, highContrast, fontSize, fontFamily, lineSpacing, accentIndex, bubbleStyle, messageDensity, chatWidth
  } = props;

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const accent = ACCENT_COLORS[accentIndex];
  const density = DENSITY_MAP[messageDensity];

  const t = {
    cardBg: theme === "dark" ? (highContrast ? "bg-black" : "bg-stone-900") : (highContrast ? "bg-white" : "bg-white"),
    inputBg: theme === "dark" ? (highContrast ? "bg-black" : "bg-stone-800") : (highContrast ? "bg-white" : "bg-stone-50"),
    bubbleBot: theme === "dark" ? (highContrast ? "bg-black" : "bg-stone-800") : (highContrast ? "bg-white" : "bg-white"),
    border: theme === "dark" ? (highContrast ? "border-white" : "border-stone-800") : (highContrast ? "border-black" : "border-stone-300"),
    borderMid: theme === "dark" ? (highContrast ? "border-white" : "border-stone-700") : (highContrast ? "border-black" : "border-stone-300"),
    textPrimary: theme === "dark" ? (highContrast ? "text-white" : "text-stone-100") : (highContrast ? "text-black" : "text-stone-900"),
    textSecondary: theme === "dark" ? (highContrast ? "text-white" : "text-stone-300") : (highContrast ? "text-black" : "text-stone-600"),
    textMuted: theme === "dark" ? (highContrast ? "text-white" : "text-stone-500") : (highContrast ? "text-black" : "text-stone-400"),
    textBubbleBot: theme === "dark" ? (highContrast ? "text-white" : "text-stone-100") : (highContrast ? "text-black" : "text-stone-800"),
  };

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [activeChat?.messages, isTyping]);

  return (
    <div className="flex-1 flex flex-col items-center min-w-0">
      {!sidebarOpen && (
          <div className={`w-full flex items-center px-4 py-3 border-b ${t.border}`}>
            <button onClick={() => setSidebarOpen(true)} className={`${t.textMuted} hover:${accent.text} transition-colors text-xl mr-3`}>☰</button>
            <span className={`${accent.text} font-semibold`}>BIM Chatbot</span>
          </div>
      )}

      {!activeChat ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4">
          <div className="text-center space-y-3">
            <h2 className={`text-4xl font-bold ${accent.text}`}>Welcome to BIM Chatbot</h2>
            <p className={t.textMuted}>Your AI assistant for BIM documentation.</p>
          </div>
          <button onClick={handleNewChat} className={`${accent.bg} ${accent.hover} text-stone-950 px-6 py-3 rounded-xl font-semibold transition-colors`}>+ Start a New Chat</button>
        </div>
      ) : (
        <>
          <div className={`flex-1 overflow-y-auto py-6 ${density.gap} w-full ${CHAT_WIDTH_MAP[chatWidth]} px-4`}>
            {activeChat.messages.length === 0 && !isTyping && <p className={`text-center ${t.textMuted} mt-20`}>Ask me anything about your BIM documents.</p>}

            {activeChat.messages.map((msg: any, i: number) => (
                <div key={`${msg.timestamp}-${i}`} className={`flex w-full mb-8 animate-slide-up ${msg.role === "user" ? "justify-end" : "justify-start"}`}>

                {msg.role === "user" ? (
                    <div className="flex flex-col items-end max-w-[85%] md:max-w-xl">
                    {msg.replyTo && (
                      <div className={`max-w-lg ${density.px} py-2 rounded-xl ${t.textMuted} ${t.inputBg} border-l-2 ${accent.border} mb-1 truncate self-end`} style={{ fontSize: `${Math.max(fontSize - 2, 10)}px` }}>
                        ↩ {msg.replyTo}
                      </div>
                    )}
                    <div className={`
                      ${bubbleStyle === "square" ? "rounded-md" : "rounded-2xl"} 
                      ${messageDensity === "compact" ? "px-4 py-2 text-sm" : messageDensity === "spacious" ? "px-6 py-4" : "px-5 py-3"} 
                      ${accent.bg} text-stone-950 font-medium break-all max-w-full
                    `}>
                      {msg.content}
                    </div>
                    <span className={`mt-1 ${t.textMuted}`} style={{ fontSize: `${Math.max(fontSize - 4, 10)}px` }}>{msg.timestamp}</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-start w-full max-w-4xl">
                    <div className="w-full text-stone-900 dark:text-stone-100">

                      <div className="prose prose-stone dark:prose-invert max-w-none w-full leading-relaxed prose-p:mb-4 prose-p:mt-0 prose-ul:my-4 prose-li:my-1 whitespace-normal">
                        <TypewriterEffect
                            text={msg.content}
                            animate={i === activeChat.messages.length - 1}
                        />
                      </div>

                      {msg.chartData && <InteractiveChart chartData={msg.chartData} theme={theme} highContrast={highContrast} />}

                      {msg.documentUrl && (
                          <a href={msg.documentUrl} download className={`mt-6 inline-flex items-center gap-2 ${accent.bg} ${accent.hover} text-stone-900 font-bold px-5 py-3 rounded-xl transition-transform hover:scale-[1.02] shadow-sm`}>
                            Download Generated Report
                          </a>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-3">
                      <span className={t.textMuted} style={{ fontSize: `${Math.max(fontSize - 4, 10)}px` }}>{msg.timestamp}</span>
                      <button onClick={() => { handleReply(msg.content); setTimeout(() => inputRef.current?.focus(), 0); }} className={`${t.textMuted} hover:${t.textPrimary} transition-colors`} style={{ fontSize: `${Math.max(fontSize - 2, 10)}px` }} title="Reply">↩ Reply</button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
                <div className="flex items-start animate-slide-up">
                  <div className="px-2 py-3 flex gap-1.5 items-center">
                    <span className={`w-2 h-2 ${accent.bg} rounded-full animate-bounce`} style={{ animationDelay: "0ms" }} />
                    <span className={`w-2 h-2 ${accent.bg} rounded-full animate-bounce`} style={{ animationDelay: "150ms" }} />
                    <span className={`w-2 h-2 ${accent.bg} rounded-full animate-bounce`} style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className={`w-full ${CHAT_WIDTH_MAP[chatWidth]} px-4 py-4 border-t ${t.border} space-y-2`}>
            {replyTo && (
              <div className={`flex items-center gap-2 ${t.inputBg} rounded-xl px-3 py-2 ${t.textMuted} border-l-2 ${accent.border}`}>
                <span className="flex-1 truncate">↩ Replying to: {replyTo}</span>
                <button onClick={() => setReplyTo(null)} className={`${t.textMuted} hover:text-red-400`} style={{ fontSize: `${Math.max(fontSize - 2, 10)}px` }}>✕</button>
              </div>
            )}

            {pendingFiles.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {pendingFiles.map((name, i) => (
                  <div key={i} className={`flex items-center gap-2 ${t.inputBg} border ${t.borderMid} rounded-xl px-3 py-1 ${t.textSecondary}`}>
                    <span> {name}</span>
                    <button onClick={() => removeFile(i)} className={`${t.textMuted} hover:text-red-400`} style={{ fontSize: `${Math.max(fontSize - 2, 10)}px` }}>✕</button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 items-center">
              <label className={`cursor-pointer ${t.inputBg} ${t.textMuted} hover:${t.textPrimary} px-4 py-3 rounded-xl text-sm font-medium transition-colors border ${t.borderMid}`}>
                Attach
                <input type="file" multiple accept=".pdf,.txt" className="hidden" onChange={(e) => { handleFileUpload(e); setTimeout(() => inputRef.current?.focus(), 0); }} />
              </label>

              <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  rows={1}
                  placeholder={replyTo ? "Type your reply..." : "Ask BIM Chatbot"}
                  className={`flex-1 resize-none ${t.inputBg} ${t.textPrimary} rounded-xl px-4 py-3 outline-none border ${t.borderMid} focus:${accent.border} transition-colors min-h-[48px] max-h-[120px] overflow-y-auto`}
              />

              <button onClick={handleSend} disabled={isTyping} className={`${accent.bg} ${accent.hover} text-stone-950 px-6 py-3 rounded-xl font-bold disabled:opacity-50 transition-colors`}>
                Send
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}