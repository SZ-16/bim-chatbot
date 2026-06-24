"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import ChatArea from "@/components/chat/ChatArea";
import SettingsModal from "@/components/settings/SettingsModal";
import { Chat, SettingsTab, Theme, BubbleStyle, MessageDensity, ChatWidth, SidebarWidth, Message } from "@/types";
import { API_URL, authHeaders } from "@/utils/api";
import { ForgeModel, isForgeFile, uploadForgeModel } from "@/utils/forge";

const getTime = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const [loggedInUser, setLoggedInUser] = useState("");
  const [loggedInEmail, setLoggedInEmail] = useState("");
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [uploadedFilename, setUploadedFilename] = useState<string>("bim_data.txt");
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("profile");
  const [fontSize, setFontSize] = useState(14);
  const [fontFamily, setFontFamily] = useState("Inter, sans-serif");
  const [theme, setTheme] = useState<Theme>("dark");
  const [highContrast, setHighContrast] = useState(false);
  const [lineSpacing, setLineSpacing] = useState(1.5);
  const [accentIndex, setAccentIndex] = useState(0);
  const [bubbleStyle, setBubbleStyle] = useState<BubbleStyle>("rounded" as any);
  const [messageDensity, setMessageDensity] = useState<MessageDensity>("comfortable" as any);
  const [chatWidth, setChatWidth] = useState<ChatWidth>("default" as any);
  const [sidebarWidth, setSidebarWidth] = useState<SidebarWidth>("default");

  useEffect(() => {
    setMounted(true);
    const fetchToken = async () => {
      try {
        // Automatically hit your Python login endpoint
        const res = await fetch(`${API_URL}/login`, { method: "POST" });
        if (res.ok) {
          const data = await res.json();
          localStorage.setItem("bim_token", data.access_token || "dummy_token");
          localStorage.setItem("chat_username", "DevUser");
          localStorage.setItem("chat_email", "dev@bim.com");
          setLoggedInUser("DevUser");
          setLoggedInEmail("dev@bim.com");
        }
      } catch (error) {
        console.error("Failed to auto-fetch token:", error);
      }
    };

    if (!localStorage.getItem("bim_token")) {
      void fetchToken();
    } else {
      setLoggedInUser(localStorage.getItem("chat_username") || "DevUser");
      setLoggedInEmail(localStorage.getItem("chat_email") || "dev@bim.com");
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("chat_username");
    localStorage.removeItem("chat_email");
    localStorage.removeItem("bim_token");
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

  const handleReply = (content: string) => setReplyTo(content);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || activeChatId === null) return;
    setPendingFiles((prev) => [...prev, ...files]);
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
    setUploadedFilename("bim_data.txt");
  };

  const getCurrentHistory = () => {
    const activeChatData = chats.find(c => c.id === activeChatId);
    return activeChatData ? activeChatData.messages
      .filter(msg => msg.content !== "..." && msg.content !== "")
      .map(msg => ({ role: msg.role, content: msg.content })) : [];
  };

  const handleSend = async () => {
    if ((!input.trim() && pendingFiles.length === 0) || activeChatId === null) return;

    const token = localStorage.getItem("bim_token");
    if (!token) {
      alert("Please log in to use the AI!");
      return;
    }

    const forgeFiles = pendingFiles.filter((file) => isForgeFile(file.name));
    const otherFiles = pendingFiles.filter((file) => !isForgeFile(file.name));
    const filesToUpload = [...pendingFiles];
    const promptToSend = input || (forgeFiles.length > 0 ? "Uploaded BIM model for viewing." : "Uploaded files for analysis.");

    let forgeModels: ForgeModel[] = [];
    if (forgeFiles.length > 0) {
      setIsTyping(true);
      try {
        forgeModels = await Promise.all(forgeFiles.map((file) => uploadForgeModel(file)));
      } catch (error) {
        alert(error instanceof Error ? error.message : "Failed to upload BIM model to Forge.");
        setIsTyping(false);
        return;
      }
    }

    const userMessage: Message = {
      role: "user",
      content: promptToSend,
      fileNames: filesToUpload.map((file) => file.name),
      forgeModels: forgeModels.length > 0 ? forgeModels : undefined,
      timestamp: getTime(),
      replyTo: replyTo ?? undefined,
    };

    setChats((prev) =>
      prev.map((chat) => chat.id === activeChatId
          ? { ...chat, title: chat.messages.length === 0 ? promptToSend.slice(0, 30) : chat.title, messages: [...chat.messages, userMessage] }
          : chat
      )
    );

    setInput("");
    setPendingFiles([]);
    setReplyTo(null);

    if (forgeFiles.length > 0 && otherFiles.length === 0 && !input.trim()) {
      setIsTyping(false);
      return;
    }

    setIsTyping(true);

    const botMessage: Message = { role: "assistant", content: "...", timestamp: getTime() };
    setChats((prev) => prev.map((chat) => chat.id === activeChatId ? { ...chat, messages: [...chat.messages, botMessage] } : chat));

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt: promptToSend }),
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);

      const data = await response.json();

      setChats((prev) =>
        prev.map((chat) => {
          if (chat.id === activeChatId) {
            const newMessages = [...chat.messages];
            const targetMsg = newMessages[newMessages.length - 1];
            targetMsg.content = data.response;
            if (data.chart_data) (targetMsg as any).chartData = data.chart_data;
            if (data.document_url) (targetMsg as any).documentUrl = `http://127.0.0.1:8000${data.document_url}`;
            return { ...chat, messages: newMessages };
          }
          return chat;
        })
      );
    } catch (error) {
      setChats((prev) =>
        prev.map((chat) => {
          if (chat.id === activeChatId) {
            const newMessages = [...chat.messages];
            newMessages[newMessages.length - 1].content = "Connection Error.";
            return { ...chat, messages: newMessages };
          }
          return chat;
        })
      );
    } finally {
      setIsTyping(false);
    }
  };

  const activeChat = chats.find((c) => c.id === activeChatId);
  const t = {
    pageBg: theme === "dark" ? (highContrast ? "bg-black" : "bg-stone-950") : (highContrast ? "bg-white" : "bg-stone-100"),
    textPrimary: theme === "dark" ? (highContrast ? "text-white" : "text-stone-100") : (highContrast ? "text-black" : "text-stone-900"),
  };

  if (!mounted) return <div className="flex h-screen items-center justify-center bg-stone-950 text-white">Loading interface...</div>;

  return (
    <div className={`flex h-screen overflow-hidden ${t.pageBg} ${t.textPrimary}`} style={{ fontSize: `${fontSize}px`, fontFamily, lineHeight: lineSpacing }}>
      {settingsOpen && (
        <SettingsModal
          setSettingsOpen={setSettingsOpen} settingsTab={settingsTab} setSettingsTab={setSettingsTab}
          loggedInUser={loggedInUser} loggedInEmail={loggedInEmail} chatCount={chats.length} handleLogout={handleLogout}
          theme={theme} setTheme={setTheme} highContrast={highContrast} setHighContrast={setHighContrast}
          fontSize={fontSize} setFontSize={setFontSize} lineSpacing={lineSpacing} setLineSpacing={setLineSpacing}
          fontFamily={fontFamily} setFontFamily={setFontFamily} accentIndex={accentIndex} setAccentIndex={setAccentIndex}
          bubbleStyle={bubbleStyle} setBubbleStyle={setBubbleStyle} messageDensity={messageDensity} setMessageDensity={setMessageDensity}
          chatWidth={chatWidth} setChatWidth={setChatWidth} sidebarWidth={sidebarWidth} setSidebarWidth={setSidebarWidth}
        />
      )}

      <Sidebar
        sidebarOpen={sidebarOpen} chats={chats} activeChatId={activeChatId} setActiveChatId={setActiveChatId}
        handleNewChat={handleNewChat} handleDeleteChat={handleDeleteChat} loggedInUser={loggedInUser}
        setSettingsOpen={setSettingsOpen} setSettingsTab={setSettingsTab} theme={theme} highContrast={highContrast}
        fontSize={fontSize} accentIndex={accentIndex} sidebarWidth={sidebarWidth}
      />

      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />}

      <ChatArea
        activeChat={activeChat} handleNewChat={handleNewChat} input={input} setInput={setInput}
        pendingFiles={pendingFiles} replyTo={replyTo} setReplyTo={setReplyTo} isTyping={isTyping || isUploading}
        handleSend={handleSend} handleFileUpload={handleFileUpload} removeFile={removeFile} handleReply={handleReply}
        sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} theme={theme} highContrast={highContrast}
        fontSize={fontSize} fontFamily={fontFamily} lineSpacing={lineSpacing} accentIndex={accentIndex}
        bubbleStyle={bubbleStyle} messageDensity={messageDensity} chatWidth={chatWidth}
      />
    </div>
  );
}