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

  // Auth State
  const [loggedInUser, setLoggedInUser] = useState("");
  const [loggedInEmail, setLoggedInEmail] = useState("");

  // Chat State
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
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
  const [bubbleStyle, setBubbleStyle] = useState<BubbleStyle>("rounded" as any);
  const [messageDensity, setMessageDensity] = useState<MessageDensity>("comfortable" as any);
  const [chatWidth, setChatWidth] = useState<ChatWidth>("default" as any);
  const [sidebarWidth, setSidebarWidth] = useState<SidebarWidth>("default");

  // Auto-Login & Token Fetcher for Development
  useEffect(() => {
    const fetchToken = async () => {
      try {
        // Automatically hit your Python login endpoint
        const res = await fetch(`${API_URL}/login`, { method: "POST" });
        if (res.ok) {
          const data = await res.json();
          // Save the VIP token directly into the browser's brain
          localStorage.setItem("bim_token", data.access_token);

          // Set some dummy user data so the UI stops redirecting you
          localStorage.setItem("chat_username", "DevUser");
          localStorage.setItem("chat_email", "dev@bim.com");
          setLoggedInUser("DevUser");
          setLoggedInEmail("dev@bim.com");
        }
      } catch (error) {
        console.error("Failed to auto-fetch token:", error);
      }
    };

    // If the browser doesn't have a token, go get one automatically!
    if (!localStorage.getItem("bim_token")) {
      fetchToken();
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

  const handleReply = (content: string) => {
    setReplyTo(content);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || activeChatId === null) return;
    setPendingFiles((prev) => [...prev, ...files]);
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
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
      prev.map((chat) =>
        chat.id === activeChatId
          ? {
              ...chat,
              title: chat.messages.length === 0 ? promptToSend.slice(0, 30) : chat.title,
              messages: [...chat.messages, userMessage],
            }
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

    // Create an empty bot message that we will stream text into
    const botMessage: Message = {
      role: "assistant",
      content: "",
      timestamp: getTime(),
    };

    setChats((prev) =>
      prev.map((chat) =>
        chat.id === activeChatId ? { ...chat, messages: [...chat.messages, botMessage] } : chat
      )
    );

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt: promptToSend }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let aiText = "";

      while (!done && reader) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value, { stream: true });
        aiText += chunkValue;

        setChats((prev) =>
          prev.map((chat) => {
            if (chat.id === activeChatId) {
              const newMessages = [...chat.messages];
              newMessages[newMessages.length - 1].content = aiText;
              return { ...chat, messages: newMessages };
            }
            return chat;
          })
        );
      }
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
      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
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