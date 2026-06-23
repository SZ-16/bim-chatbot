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
  const [mounted, setMounted] = useState(false);

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

  // File Upload Tracker State
  const [uploadedFilename, setUploadedFilename] = useState<string>("bim_data.txt");
  const [isUploading, setIsUploading] = useState<boolean>(false);

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

  useEffect(() => {
    setMounted(true);

    const fetchToken = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/login", { method: "POST" });
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

  const handleReply = (content: string) => {
    setReplyTo(content);
  };

  // Uploads file directly to FastAPI
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || activeChatId === null) return;

    const file = files[0];

    setPendingFiles((prev) => [...prev, file.name]);
    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://127.0.0.1:8000/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to upload document");

      const data = await response.json();
      setUploadedFilename(data.filename);
      console.log(`Successfully uploaded to backend: ${data.filename}`);

    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload failed. Make sure it's a PDF or TXT.");
      setPendingFiles((prev) => prev.filter(name => name !== file.name));
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const removeFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
    setUploadedFilename("bim_data.txt"); // Revert to default
  };

  const handleSend = async () => {
    if ((!input.trim() && pendingFiles.length === 0) || activeChatId === null) return;

    const promptToSend = input || "Uploaded files for analysis.";
    const userMessage: Message = {
      role: "user",
      content: promptToSend,
      fileNames: pendingFiles.length > 0 ? pendingFiles : undefined,
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
    setIsTyping(true);

    const botMessage: Message = {
      role: "assistant",
      content: "...",
      timestamp: getTime(),
    };

    setChats((prev) =>
      prev.map((chat) =>
        chat.id === activeChatId ? { ...chat, messages: [...chat.messages, botMessage] } : chat
      )
    );

    try {
      const token = localStorage.getItem("bim_token");

      if (!token) {
        alert("Please log in to use the AI!");
        setIsTyping(false);
        return;
      }

      // THE FIX: Grab the existing chat history from the state
      const activeChatData = chats.find(c => c.id === activeChatId);
      const currentHistory = activeChatData ? activeChatData.messages
        .filter(msg => msg.content !== "..." && msg.content !== "")
        .map(msg => ({
          role: msg.role,
          content: msg.content
        })) : [];

      const response = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        // THE FIX: Send the history AND the chat_id to Python
        body: JSON.stringify({
          message: promptToSend,
          filename: uploadedFilename,
          history: currentHistory,
          chat_id: activeChatId
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();

      setChats((prev) =>
        prev.map((chat) => {
          if (chat.id === activeChatId) {
            const newMessages = [...chat.messages];
            newMessages[newMessages.length - 1].content = data.response;
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

  if (!mounted) {
    return <div className="flex h-screen items-center justify-center bg-stone-950 text-white">Loading interface...</div>;
  }

  return (
    <div
      className={`flex h-screen overflow-hidden ${t.pageBg} ${t.textPrimary}`}
      style={{ fontSize: `${fontSize}px`, fontFamily, lineHeight: lineSpacing }}
    >
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
<<<<<<< Updated upstream
      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      {/* Main Chat Area */}
=======

>>>>>>> Stashed changes
      <ChatArea
        activeChat={activeChat} handleNewChat={handleNewChat}
        input={input} setInput={setInput}
        pendingFiles={pendingFiles}
        replyTo={replyTo} setReplyTo={setReplyTo}
        isTyping={isTyping || isUploading}
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