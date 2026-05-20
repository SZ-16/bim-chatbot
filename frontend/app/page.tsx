"use client";
import { useState, useRef, useEffect } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  fileNames?: string[];
  replyTo?: string;
};

type Chat = {
  id: number;
  title: string;
  messages: Message[];
};

const getTime = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export default function Home() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [pendingFiles, setPendingFiles] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const activeChat = chats.find((c) => c.id === activeChatId);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat?.messages, isTyping]);

  const handleNewChat = () => {
    const newChat: Chat = {
      id: Date.now(),
      title: "New Chat",
      messages: [],
    };
    setChats((prev) => [newChat, ...prev]);
    setActiveChatId(newChat.id);
  };

  const handleDeleteChat = (id: number) => {
    setChats((prev) => prev.filter((chat) => chat.id !== id));
    if (activeChatId === id) setActiveChatId(null);
  };

  const handleReply = (content: string) => {
    setReplyTo(content);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleSend = () => {
    if ((!input.trim() && pendingFiles.length === 0) || activeChatId === null) return;

    const userMessage: Message = {
      role: "user",
      content: input || "Uploaded files for analysis.",
      fileNames: pendingFiles.length > 0 ? pendingFiles : undefined,
      timestamp: getTime(),
      replyTo: replyTo ?? undefined,
    };

    setChats((prev) =>
      prev.map((chat) =>
        chat.id === activeChatId
          ? {
              ...chat,
              title:
                chat.messages.length === 0
                  ? (input || pendingFiles[0] || "New Chat").slice(0, 30)
                  : chat.title,
              messages: [...chat.messages, userMessage],
            }
          : chat
      )
    );

    setInput("");
    setPendingFiles([]);
    setReplyTo(null);
    setIsTyping(true);

    setTimeout(() => {
      const botMessage: Message = {
        role: "assistant",
        content:
          pendingFiles.length > 0
            ? `I received ${pendingFiles.length} file(s): ${pendingFiles.join(", ")}. ${input ? `You asked: "${input}". ` : ""}I will analyse them and answer any questions you have.`
            : "Hello! I am the BIM Chatbot. How can I help you?",
        timestamp: getTime(),
      };

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === activeChatId
            ? { ...chat, messages: [...chat.messages, botMessage] }
            : chat
        )
      );
      setIsTyping(false);
    }, 1500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || activeChatId === null) return;
    setPendingFiles((prev) => [...prev, ...files.map((f) => f.name)]);
    setTimeout(() => inputRef.current?.focus(), 0);
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="flex h-screen bg-stone-950 text-stone-100">

      {/* Sidebar */}
      {sidebarOpen && (
        <div className="w-64 bg-stone-900 border-r border-stone-800 flex flex-col">
          <div className="px-4 py-4 border-b border-stone-800 flex items-center justify-between">
            <h1 className="text-lg font-semibold text-amber-400">BIM Chatbot</h1>

          </div>
          <div className="px-4 py-3">
            <button
              onClick={handleNewChat}
              className="w-full bg-amber-500 hover:bg-amber-600 text-stone-950 py-2 rounded-xl text-sm font-semibold transition-colors"
            >
              + New Chat
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-2">
            <p className="text-xs text-stone-500 px-2 mb-2">Recent Chats</p>
            {chats.length === 0 && (
              <p className="text-xs text-stone-600 px-2">No chats yet.</p>
            )}
            {chats.map((chat) => (
              <div
                key={chat.id}
                className={`flex items-center gap-1 w-full px-3 py-2 rounded-xl text-sm mb-1 transition-colors ${
                  chat.id === activeChatId
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : "text-stone-400 hover:bg-stone-800 hover:text-stone-200"
                }`}
              >
                <button
                  onClick={() => setActiveChatId(chat.id)}
                  className="flex-1 text-left truncate"
                >
                  {chat.title}
                </button>
                <button
                  onClick={() => handleDeleteChat(chat.id)}
                  className="text-stone-600 hover:text-red-400 transition-colors text-xs px-1"
                >
                  🗑
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Area */}
      <div className="flex-1 flex flex-col items-center">

        {/* Top bar with toggle button */}
        <div className="w-full flex items-center px-4 py-3 border-b border-stone-800">
          <button
            onClick={() => setSidebarOpen((prev) => !prev)}
            className="text-stone-500 hover:text-amber-400 transition-colors text-xl mr-3"
            title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            ☰
          </button>
          {!sidebarOpen && (
            <span className="text-amber-400 font-semibold text-sm">BIM Chatbot</span>
          )}
        </div>

        {!activeChat ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4">
            <div className="text-center space-y-3">
              <div className="text-6xl mb-2">🏗️</div>
              <h2 className="text-4xl font-bold text-amber-400">Welcome to BIM Chatbot</h2>
              <p className="text-stone-400 text-lg">
                Your AI assistant for BIM documentation.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 w-full max-w-md text-sm text-stone-400">
              <div className="bg-stone-900 border border-stone-800 hover:border-amber-500/40 rounded-xl px-4 py-3 transition-colors">
                🔍 Search and retrieve BIM documents instantly
              </div>
              <div className="bg-stone-900 border border-stone-800 hover:border-amber-500/40 rounded-xl px-4 py-3 transition-colors">
                📄 Summarise long technical reports
              </div>
              <div className="bg-stone-900 border border-stone-800 hover:border-amber-500/40 rounded-xl px-4 py-3 transition-colors">
                ✅ Check compliance against BIM standards
              </div>
            </div>
            <button
              onClick={handleNewChat}
              className="bg-amber-500 hover:bg-amber-600 text-stone-950 px-6 py-3 rounded-xl text-sm font-semibold transition-colors"
            >
              + Start a New Chat
            </button>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto py-6 space-y-4 w-full max-w-2xl px-4">
              {activeChat.messages.length === 0 && !isTyping && (
                <p className="text-center text-stone-500 mt-20">
                  Ask me anything about your BIM documents.
                </p>
              )}
              {activeChat.messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                >
                  {/* Reply bubble */}
                  {msg.replyTo && (
                    <div
                      className={`max-w-lg px-3 py-2 rounded-xl text-xs text-stone-400 bg-stone-800 border-l-2 border-amber-500 mb-1 truncate ${
                        msg.role === "user" ? "self-end" : "self-start"
                      }`}
                    >
                      ↩ {msg.replyTo}
                    </div>
                  )}

                  {/* Message bubble */}
                  <div
                    className={`max-w-lg px-4 py-2 rounded-2xl text-sm ${
                      msg.role === "user"
                        ? "bg-amber-500 text-stone-950 font-medium"
                        : "bg-stone-800 text-stone-100"
                    }`}
                  >
                    {msg.fileNames && msg.fileNames.length > 0 && (
                      <div className="mb-2 space-y-1">
                        {msg.fileNames.map((name, fi) => (
                          <p key={fi} className="text-xs font-medium opacity-80">
                            📎 {name}
                          </p>
                        ))}
                      </div>
                    )}
                    {msg.content}
                  </div>

                  {/* Timestamp + reply button */}
                  <div className="flex items-center gap-2 mt-1 px-1">
                    <span className="text-xs text-stone-600">{msg.timestamp}</span>
                    <button
                      onClick={() => handleReply(msg.content)}
                      className="text-xs text-stone-600 hover:text-stone-300 transition-colors"
                      title="Reply"
                    >
                      ↩
                    </button>
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex items-start">
                  <div className="bg-stone-800 px-4 py-3 rounded-2xl flex gap-1 items-center">
                    <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="w-full max-w-2xl px-4 py-4 border-t border-stone-800 space-y-2">

              {/* Reply preview bar */}
              {replyTo && (
                <div className="flex items-center gap-2 bg-stone-800 rounded-xl px-3 py-2 text-sm text-stone-400 border-l-2 border-amber-500">
                  <span className="flex-1 truncate">↩ Replying to: {replyTo}</span>
                  <button
                    onClick={() => setReplyTo(null)}
                    className="text-stone-500 hover:text-red-400 text-xs"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Pending files */}
              {pendingFiles.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {pendingFiles.map((name, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 bg-stone-800 border border-stone-700 rounded-xl px-3 py-1 text-sm text-stone-300"
                    >
                      <span>📎 {name}</span>
                      <button
                        onClick={() => removeFile(i)}
                        className="text-stone-500 hover:text-red-400 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 items-center">
                <label className="cursor-pointer bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-amber-400 px-3 py-2 rounded-xl text-sm font-medium transition-colors border border-stone-700">
                  📎
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.dwg,.rvt,.ifc,.nwc,.nwd,.dxf,.xlsx,.xls,.csv,.docx,.doc,.txt,.json,.xml,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>

                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder={
                    replyTo
                      ? "Type your reply..."
                      : pendingFiles.length > 0
                      ? "Add a message or just press Send..."
                      : "Ask something about your BIM documents..."
                  }
                  className="flex-1 bg-stone-800 text-stone-100 rounded-xl px-3 py-2 text-sm outline-none placeholder-stone-500 border border-stone-700 focus:border-amber-500/50 transition-colors"
                />

                <button
                  onClick={handleSend}
                  disabled={isTyping}
                  className="bg-amber-500 hover:bg-amber-600 text-stone-950 px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors"
                >
                  Send
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}