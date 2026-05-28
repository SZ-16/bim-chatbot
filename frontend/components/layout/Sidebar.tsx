"use client";
import { ACCENT_COLORS, SIDEBAR_WIDTH_MAP } from "@/utils/theme";
import { Chat, SettingsTab, Theme, SidebarWidth } from "@/types";

type SidebarProps = {
  sidebarOpen: boolean;
  chats: Chat[];
  activeChatId: number | null;
  setActiveChatId: (id: number) => void;
  handleNewChat: () => void;
  handleDeleteChat: (id: number) => void;
  loggedInUser: string;
  setSettingsOpen: (val: boolean) => void;
  setSettingsTab: (val: SettingsTab) => void;
  
  // Theme & Appearance
  theme: Theme;
  highContrast: boolean;
  fontSize: number;
  accentIndex: number;
  sidebarWidth: SidebarWidth;
};

export default function Sidebar(props: SidebarProps) {
  const {
    sidebarOpen, chats, activeChatId, setActiveChatId,
    handleNewChat, handleDeleteChat, loggedInUser,
    setSettingsOpen, setSettingsTab,
    theme, highContrast, fontSize, accentIndex, sidebarWidth
  } = props;

  // If the sidebar is closed, don't render it at all
  if (!sidebarOpen) return null;

  const accent = ACCENT_COLORS[accentIndex];

  // Re-calculate the theme classes for the sidebar
  const t = {
    sidebarBg:     theme === "dark" ? (highContrast ? "bg-black"     : "bg-stone-900")  : (highContrast ? "bg-white"      : "bg-stone-200"),
    border:        theme === "dark" ? (highContrast ? "border-white" : "border-stone-800") : (highContrast ? "border-black" : "border-stone-300"),
    textPrimary:   theme === "dark" ? (highContrast ? "text-white"   : "text-stone-100") : (highContrast ? "text-black"   : "text-stone-900"),
    textSecondary: theme === "dark" ? (highContrast ? "text-white"   : "text-stone-300") : (highContrast ? "text-black"   : "text-stone-600"),
    textMuted:     theme === "dark" ? (highContrast ? "text-white"   : "text-stone-500") : (highContrast ? "text-black"   : "text-stone-400"),
  };

  return (
    <div className={`${SIDEBAR_WIDTH_MAP[sidebarWidth]} ${t.sidebarBg} border-r ${t.border} flex flex-col shrink-0 transition-all`}>
      
      {/* Header */}
      <div className={`px-4 py-4 border-b ${t.border}`}>
        <h1 className={`text-lg font-semibold ${accent.text}`}>BIM Chatbot</h1>
      </div>
      
      {/* New Chat Button */}
      <div className="px-4 py-3">
        <button onClick={handleNewChat} className={`w-full ${accent.bg} ${accent.hover} text-stone-950 py-2 rounded-xl font-semibold transition-colors`}>
          + New Chat
        </button>
      </div>
      
      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-2">
        <p className={`${t.textMuted} px-2 mb-2`} style={{ fontSize: `${Math.max(fontSize - 2, 10)}px` }}>Recent Chats</p>
        
        {chats.length === 0 && (
          <p className={`${t.textMuted} px-2`} style={{ fontSize: `${Math.max(fontSize - 2, 10)}px` }}>No chats yet.</p>
        )}
        
        {chats.map((chat) => (
          <div
            key={chat.id}
            className={`flex items-center gap-1 w-full px-3 py-2 rounded-xl mb-1 transition-colors ${
              chat.id === activeChatId
                ? `${accent.active} ${accent.text} border ${accent.border}`
                : `${t.textMuted} hover:${t.textPrimary}`
            }`}
          >
            <button onClick={() => setActiveChatId(chat.id)} className="flex-1 text-left truncate">
              {chat.title}
            </button>
            <button 
              onClick={() => handleDeleteChat(chat.id)} 
              className={`${t.textMuted} hover:text-red-400 transition-colors px-1`} 
              style={{ fontSize: `${Math.max(fontSize - 2, 10)}px` }}
              title="Delete Chat"
            >
              🗑
            </button>
          </div>
        ))}
      </div>
      
      {/* Footer / User Profile */}
      <div className={`px-4 py-4 border-t ${t.border} flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-full ${accent.bg} flex items-center justify-center text-stone-950 text-xs font-bold`}>
            {loggedInUser[0]?.toUpperCase() || "U"}
          </div>
          <span className={`${t.textSecondary} truncate max-w-28`}>
            {loggedInUser || "User"}
          </span>
        </div>
        <button 
          onClick={() => { setSettingsOpen(true); setSettingsTab("profile"); }} 
          className={`${t.textMuted} hover:${accent.text} transition-colors`} 
          title="Settings"
        >
          ⚙️
        </button>
      </div>
    </div>
  );
}