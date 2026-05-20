"use client";
import { useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  fileName?: string;
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

  const activeChat = chats.find((c) => c.id === activeChatId);

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

  const handleSend = () => {
    if (!input.trim() || activeChatId === null) return;

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: getTime(),
    };
    const botMessage: Message = {
      role: "assistant",
      content: "Hello! I am the BIM Chatbot. How can I help you?",
      timestamp: getTime(),
    };

    setChats((prev) =>
      prev.map((chat) =>
        chat.id === activeChatId
          ? {
              ...chat,
              title:
                chat.messages.length === 0 ? input.slice(0, 30) : chat.title,
              messages: [...chat.messages, userMessage, botMessage],
            }
          : chat
      )
    );
    setInput("");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || activeChatId === null) return;

    const fileMessage: Message = {
      role: "user",
      content: `Uploaded a file for analysis.`,
      fileName: file.name,
      timestamp: getTime(),
    };
    const botMessage: Message = {
      role: "assistant",
      content: `I received "${file.name}". I will analyse it and answer any questions you have about it.`,
      timestamp: getTime(),
    };

    setChats((prev) =>
      prev.map((chat) =>
        chat.id === activeChatId
          ? {
              ...chat,
              title: chat.messages.length === 0 ? file.name.slice(0, 30) : chat.title,
              messages: [...chat.messages, fileMessage, botMessage],
            }
          : chat
      )
    );
  };

  return (
    <div className="flex h-screen bg-gray-950 text-white">

      {/* Sidebar */}
      <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">

        {/* Sidebar Header */}
        <div className="px-4 py-4 border-b border-gray-800">
          <h1 className="text-lg font-semibold">BIM Chatbot</h1>
        </div>

        {/* New Chat Button */}
        <div className="px-4 py-3">
          <button
            onClick={handleNewChat}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl text-sm font-medium"
          >
            + New Chat
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto px-2">
          <p className="text-xs text-gray-500 px-2 mb-2">Recent Chats</p>
          {chats.length === 0 && (
            <p className="text-xs text-gray-600 px-2">No chats yet.</p>
          )}
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={`flex items-center gap-1 w-full px-3 py-2 rounded-xl text-sm mb-1 transition-colors ${
                chat.id === activeChatId
                  ? "bg-gray-700 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
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
                className="text-gray-600 hover:text-red-400 transition-colors text-xs px-1"
              >
                🗑
              </button>
            </div>
          ))}
        </div>

        {/* Settings */}
        <div className="px-4 py-4 border-t border-gray-800 space-y-2">
          <p className="text-xs text-gray-500">Settings</p>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Model</span>
            <select className="bg-gray-800 text-gray-300 text-xs rounded-lg px-2 py-1 outline-none">
              <option>Ollama</option>
              <option>GPT-4o</option>
              <option>Claude</option>
            </select>
          </div>
        </div>

      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col items-center">

        {/* Welcome Screen */}
        {!activeChat ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4">
            <div className="text-center space-y-3">
              <h2 className="text-4xl font-bold text-white">Welcome to BIM Chatbot</h2>
              <p className="text-gray-400 text-lg">
                Your AI assistant for BIM documentation.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 w-full max-w-md text-sm text-gray-400">
              <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3">
                🔍 Search and retrieve BIM documents instantly
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3">
                📄 Summarise long technical reports
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3">
                ✅ Check compliance against BIM standards
              </div>
            </div>
            <button
              onClick={handleNewChat}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-sm font-medium"
            >
              + Start a New Chat
            </button>
          </div>

        ) : (

          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto py-6 space-y-4 w-full max-w-2xl px-4">
              {activeChat.messages.length === 0 && (
                <p className="text-center text-gray-500 mt-20">
                  Ask me anything about your BIM documents.
                </p>
              )}
              {activeChat.messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-lg px-4 py-2 rounded-2xl text-sm ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-800 text-gray-100"
                    }`}
                  >
                    {msg.fileName && (
                      <p className="text-xs font-medium mb-1 opacity-80">
                        📎 {msg.fileName}
                      </p>
                    )}
                    {msg.content}
                  </div>
                  <span className="text-xs text-gray-600 mt-1 px-1">
                    {msg.timestamp}
                  </span>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="w-full max-w-2xl px-4 py-4 border-t border-gray-800 flex gap-2 items-center">

              {/* File Upload Button */}
              <label className="cursor-pointer bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white px-3 py-2 rounded-xl text-sm font-medium transition-colors">
                📎
                <input
                  type="file"
                  accept=".pdf,.dwg,.rvt"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>

              {/* Text Input */}
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask something about your BIM documents..."
                className="flex-1 bg-gray-800 text-white rounded-xl px-3 py-2 text-sm outline-none placeholder-gray-500"
              />

              {/* Send Button */}
              <button
                onClick={handleSend}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium"
              >
                Send
              </button>

            </div>
          </>
        )}
      </div>
    </div>
  );
}