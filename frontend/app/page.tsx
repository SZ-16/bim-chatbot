"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import ChatArea from "@/components/chat/ChatArea";
import SettingsModal from "@/components/settings/SettingsModal";
import { Chat, SettingsTab, Theme, BubbleStyle, MessageDensity, ChatWidth, SidebarWidth, Message } from "@/types";

const getTime = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export default function Home() {
  const router = useRouter();

  // Auth State
  const [loggedInUser, setLoggedInUser] = useState("");
  const [loggedInEmail, setLoggedInEmail] = useState("");

  // Chat State
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [pendingFiles, setPendingFiles] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);

  // Layout & Settings State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("profile");

  // Accessibility State
  const [fontSize, setFontSize] = useState(14);
  const [fontFamily, setFontFamily] = useState("Inter, sans-serif");
  const [theme, setTheme] = useState<Theme>("dark");
  const [highContrast, setHighContrast] = useState(false);
  const [lineSpacing, setLineSpacing] = useState(1.5);

  // Appearance State
  const [accentIndex, setAccentIndex] = useState(0);
  const [bubbleStyle, setBubbleStyle] = useState<BubbleStyle>("rounded");
  const [messageDensity, setMessageDensity] = useState<MessageDensity>("comfortable");
  const [chatWidth, setChatWidth] = useState<ChatWidth>("default");
  const [sidebarWidth, setSidebarWidth] = useState<SidebarWidth>("default");

  // Check auth on mount
  useEffect(() => {
    const user = localStorage.getItem("chat_username");
    const email = localStorage.getItem("chat_email");
    if (!user || !email) {
      router.push("/login");
    } else {
      setLoggedInUser(user);
      setLoggedInEmail(email);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("chat_username");
    localStorage.removeItem("chat_email");
    router.push("/login");
  };

  const handleNewChat = () => {
    const newChat: Chat = { id: Date.now(), title: "New Chat", messages: [] };
    setChats((prev) => [newChat, ...prev]);
    setActiveChatId(newChat.id);
  };

  const handleDeleteChat = (id: number) => {
    setChats((prev) => prev.filter((chat) => chat.id !== id));
    if (activeChatId === id) setActiveChatId(null);
  };

  const handleReply = (content: string) => {
    setReplyTo(content);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || activeChatId === null) return;
    setPendingFiles((prev) => [...prev, ...files.map((f) => f.name)]);
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
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
              title: chat.messages.length === 0 ? (input || pendingFiles[0] || "New Chat").slice(0, 30) : chat.title,
              messages: [...chat.messages, userMessage],
            }
          : chat
      )
    );
    
    setInput(""); setPendingFiles([]); setReplyTo(null); setIsTyping(true);
    
    // Simulate AI response (Replace this with WebSocket/RAG integration later)
    setTimeout(() => {
      const botMessage: Message = {
        role: "assistant",
        content: pendingFiles.length > 0
          ? `I received ${pendingFiles.length} file(s): ${pendingFiles.join(", ")}. ${input ? `You asked: "${input}". ` : ""}I will analyse them and answer any questions you have.`
          : "Hello! I am the BIM Chatbot. How can I help you?",
        timestamp: getTime(),
      };
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === activeChatId ? { ...chat, messages: [...chat.messages, botMessage] } : chat
        )
      );
      setIsTyping(false);
    }, 1500);
  };

  const activeChat = chats.find((c) => c.id === activeChatId);

  // Global Theme Classes
  const t = {
    pageBg: theme === "dark" ? (highContrast ? "bg-black" : "bg-stone-950") : (highContrast ? "bg-white" : "bg-stone-100"),
    textPrimary: theme === "dark" ? (highContrast ? "text-white" : "text-stone-100") : (highContrast ? "text-black" : "text-stone-900"),
  };

  return (
    <div 
      className={`flex h-screen overflow-hidden ${t.pageBg} ${t.textPrimary}`}
      style={{ fontSize: `${fontSize}px`, fontFamily, lineHeight: lineSpacing }}
    >
      {/* Settings Modal */}
      {settingsOpen && (
        <SettingsModal
          setSettingsOpen={setSettingsOpen}
          settingsTab={settingsTab} setSettingsTab={setSettingsTab}
          loggedInUser={loggedInUser} loggedInEmail={loggedInEmail}
          chatCount={chats.length} handleLogout={handleLogout}
          theme={theme} setTheme={setTheme}
          highContrast={highContrast} setHighContrast={setHighContrast}
          fontSize={fontSize} setFontSize={setFontSize}
          lineSpacing={lineSpacing} setLineSpacing={setLineSpacing}
          fontFamily={fontFamily} setFontFamily={setFontFamily}
          accentIndex={accentIndex} setAccentIndex={setAccentIndex}
          bubbleStyle={bubbleStyle} setBubbleStyle={setBubbleStyle}
          messageDensity={messageDensity} setMessageDensity={setMessageDensity}
          chatWidth={chatWidth} setChatWidth={setChatWidth}
          sidebarWidth={sidebarWidth} setSidebarWidth={setSidebarWidth}
        />
      )}

      {/* Sidebar Navigation */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        chats={chats}
        activeChatId={activeChatId} setActiveChatId={setActiveChatId}
        handleNewChat={handleNewChat} handleDeleteChat={handleDeleteChat}
        loggedInUser={loggedInUser}
        setSettingsOpen={setSettingsOpen} setSettingsTab={setSettingsTab}
        theme={theme} highContrast={highContrast}
        fontSize={fontSize} accentIndex={accentIndex} sidebarWidth={sidebarWidth}
      />

      {/* Main Chat Area */}
      <ChatArea
        activeChat={activeChat} handleNewChat={handleNewChat}
        input={input} setInput={setInput}
        pendingFiles={pendingFiles}
        replyTo={replyTo} setReplyTo={setReplyTo}
        isTyping={isTyping}
        handleSend={handleSend} handleFileUpload={handleFileUpload}
        removeFile={removeFile} handleReply={handleReply}
        sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}
        theme={theme} highContrast={highContrast}
        fontSize={fontSize} fontFamily={fontFamily} lineSpacing={lineSpacing}
        accentIndex={accentIndex} bubbleStyle={bubbleStyle}
        messageDensity={messageDensity} chatWidth={chatWidth}
      />
    </div>
  );
}