"use client";
import { ACCENT_COLORS } from "@/utils/theme";
import { 
  SettingsTab, Theme, BubbleStyle, 
  MessageDensity, ChatWidth, SidebarWidth 
} from "@/types";

type SettingsModalProps = {
  setSettingsOpen: (open: boolean) => void;
  settingsTab: SettingsTab;
  setSettingsTab: (tab: SettingsTab) => void;
  
  // User Profile
  loggedInUser: string;
  loggedInEmail: string;
  chatCount: number;
  handleLogout: () => void;
  
  // Accessibility
  theme: Theme;
  setTheme: (theme: Theme) => void;
  highContrast: boolean;
  setHighContrast: (val: boolean) => void;
  fontSize: number;
  setFontSize: (val: number) => void;
  lineSpacing: number;
  setLineSpacing: (val: number) => void;
  fontFamily: string;
  setFontFamily: (val: string) => void;
  
  // Appearance
  accentIndex: number;
  setAccentIndex: (val: number) => void;
  bubbleStyle: BubbleStyle;
  setBubbleStyle: (val: BubbleStyle) => void;
  messageDensity: MessageDensity;
  setMessageDensity: (val: MessageDensity) => void;
  chatWidth: ChatWidth;
  setChatWidth: (val: ChatWidth) => void;
  sidebarWidth: SidebarWidth;
  setSidebarWidth: (val: SidebarWidth) => void;
};

const SETTINGS_TABS: { id: SettingsTab; label: string; icon: string }[] = [
  { id: "profile",       label: "Profile",       icon: "👤" },
  { id: "accessibility", label: "Accessibility", icon: "♿" },
  { id: "appearance",    label: "Appearance",    icon: "🎨" },
];

export default function SettingsModal(props: SettingsModalProps) {
  const {
    setSettingsOpen, settingsTab, setSettingsTab,
    loggedInUser, loggedInEmail, chatCount, handleLogout,
    theme, setTheme, highContrast, setHighContrast,
    fontSize, setFontSize, lineSpacing, setLineSpacing,
    fontFamily, setFontFamily, accentIndex, setAccentIndex,
    bubbleStyle, setBubbleStyle, messageDensity, setMessageDensity,
    chatWidth, setChatWidth, sidebarWidth, setSidebarWidth
  } = props;

  const accent = ACCENT_COLORS[accentIndex];

  // Re-calculate the theme classes needed for the modal
  const t = {
    modalBg:      theme === "dark" ? (highContrast ? "bg-black"     : "bg-stone-900")  : (highContrast ? "bg-white"      : "bg-white"),
    modalSidebar: theme === "dark" ? (highContrast ? "bg-black"     : "bg-stone-950")  : (highContrast ? "bg-stone-100"  : "bg-stone-100"),
    border:       theme === "dark" ? (highContrast ? "border-white" : "border-stone-800") : (highContrast ? "border-black" : "border-stone-300"),
    borderMid:    theme === "dark" ? (highContrast ? "border-white" : "border-stone-700") : (highContrast ? "border-black" : "border-stone-300"),
    textPrimary:  theme === "dark" ? (highContrast ? "text-white"   : "text-stone-100") : (highContrast ? "text-black"   : "text-stone-900"),
    textSecondary:theme === "dark" ? (highContrast ? "text-white"   : "text-stone-300") : (highContrast ? "text-black"   : "text-stone-600"),
    textMuted:    theme === "dark" ? (highContrast ? "text-white"   : "text-stone-500") : (highContrast ? "text-black"   : "text-stone-400"),
    inputBg:      theme === "dark" ? (highContrast ? "bg-black"     : "bg-stone-800")  : (highContrast ? "bg-white"      : "bg-stone-50"),
  };

  const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className={`relative w-11 h-6 rounded-full transition-colors ${value ? accent.bg : (theme === "dark" ? "bg-stone-700" : "bg-stone-300")}`}
    >
      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${value ? "left-6" : "left-1"}`} />
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className={`${t.modalBg} border ${t.border} rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[90vh] md:max-h-none`} style={{ height: "auto", minHeight: "520px" }}>

        {/* Left tab rail */}
        <div className={`${t.modalSidebar} border-b md:border-b-0 md:border-r ${t.border} flex flex-row md:flex-col overflow-x-auto md:w-44 shrink-0`}>
          <p className={`hidden md:block text-xs font-semibold uppercase tracking-widest ${t.textMuted} px-4 py-3 mb-1`}>Settings</p>
          {SETTINGS_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSettingsTab(tab.id)}
              className={`flex items-center gap-2 md:gap-3 px-4 py-3 md:py-2.5 text-left transition-colors whitespace-nowrap ${
                settingsTab === tab.id
                  ? `${accent.text} bg-white/5 border-b-2 md:border-b-0 md:border-r-2 ${accent.border}`
                  : `${t.textMuted} hover:${t.textPrimary}`
              }`}
            >
              <span>{tab.icon}</span>
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
          <div className="hidden md:block flex-1" />
          <button onClick={() => setSettingsOpen(false)} className={`hidden md:block mx-4 mt-4 text-xs ${t.textMuted} hover:text-red-400 transition-colors text-left pb-4`}>✕ Close</button>
        </div>

        {/* Right content */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-5 space-y-5 relative">

          {/* Mobile-only Close Button */}
          <button
            onClick={() => setSettingsOpen(false)}
            className={`md:hidden absolute top-4 right-4 ${t.textMuted} hover:text-red-400 transition-colors text-xl font-bold`}
          >
            ✕
          </button>

          {/* Profile Tab */}
          {settingsTab === "profile" && (
            <div className="space-y-5">
              <h3 className={`font-semibold text-base ${t.textPrimary}`}>Profile</h3>
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-full ${accent.bg} flex items-center justify-center text-stone-950 text-2xl font-bold`}>
                  {loggedInUser[0]?.toUpperCase() || "U"}
                </div>
                <div>
                  <p className={`font-semibold ${t.textPrimary}`}>{loggedInUser}</p>
                  <p className={t.textMuted} style={{ fontSize: `${Math.max(fontSize - 2, 10)}px` }}>{loggedInEmail}</p>
                </div>
              </div>
              <div className="space-y-1">
                {[["Username", loggedInUser], ["Email", loggedInEmail], ["Total Chats", String(chatCount)]].map(([label, value]) => (
                  <div key={label} className={`flex justify-between py-2 border-b ${t.border}`}>
                    <span className={t.textMuted}>{label}</span>
                    <span className={t.textSecondary}>{value}</span>
                  </div>
                ))}
              </div>
              <button onClick={handleLogout} className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 py-2 rounded-xl font-medium transition-colors">
                Sign Out
              </button>
            </div>
          )}

          {/* Accessibility Tab */}
          {settingsTab === "accessibility" && (
            <div className="space-y-5">
              <h3 className={`font-semibold text-base ${t.textPrimary}`}>Accessibility</h3>

              <div className={`flex items-center justify-between py-3 border-b ${t.border}`}>
                <div>
                  <p className={t.textPrimary}>Dark Mode</p>
                  <p className={t.textMuted} style={{ fontSize: `${Math.max(fontSize - 2, 10)}px` }}>Switch between dark and light theme</p>
                </div>
                <Toggle value={theme === "dark"} onChange={() => setTheme(theme === "dark" ? "light" : "dark")} />
              </div>

              <div className={`flex items-center justify-between py-3 border-b ${t.border}`}>
                <div>
                  <p className={t.textPrimary}>High Contrast</p>
                  <p className={t.textMuted} style={{ fontSize: `${Math.max(fontSize - 2, 10)}px` }}>Increase contrast for better visibility</p>
                </div>
                <Toggle value={highContrast} onChange={() => setHighContrast(!highContrast)} />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className={t.textPrimary}>Font Size</label>
                  <span className={`${accent.text} font-medium`} style={{ fontSize: `${Math.max(fontSize - 2, 10)}px` }}>{fontSize}px</span>
                </div>
                <input type="range" min={12} max={20} value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="w-full accent-amber-500" />
                <div className={`flex justify-between ${t.textMuted}`} style={{ fontSize: `${Math.max(fontSize - 2, 10)}px` }}>
                  <span>Small (12px)</span><span>Large (20px)</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className={t.textPrimary}>Line Spacing</label>
                  <span className={`${accent.text} font-medium`} style={{ fontSize: `${Math.max(fontSize - 2, 10)}px` }}>
                    {lineSpacing <= 1.3 ? "Compact" : lineSpacing <= 1.6 ? "Default" : "Relaxed"}
                  </span>
                </div>
                <input type="range" min={1.2} max={2} step={0.1} value={lineSpacing} onChange={(e) => setLineSpacing(Number(e.target.value))} className="w-full accent-amber-500" />
                <div className={`flex justify-between ${t.textMuted}`} style={{ fontSize: `${Math.max(fontSize - 2, 10)}px` }}>
                  <span>Compact</span><span>Relaxed</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className={t.textPrimary}>Font Style</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Default", value: "Inter, sans-serif" },
                    { label: "Serif", value: "Georgia, serif" },
                    { label: "Mono", value: "monospace" },
                    { label: "Dyslexic-friendly", value: "Verdana, sans-serif" },
                  ].map((f) => (
                    <button
                      key={f.value}
                      onClick={() => setFontFamily(f.value)}
                      style={{ fontFamily: f.value }}
                      className={`px-3 py-2 rounded-xl border transition-colors ${fontFamily === f.value ? `${accent.active} ${accent.border} ${accent.text}` : `${t.inputBg} ${t.borderMid} ${t.textMuted}`}`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className={`${t.inputBg} border ${t.borderMid} rounded-xl px-4 py-3`}>
                <p className={t.textMuted} style={{ fontSize: `${Math.max(fontSize - 2, 10)}px` }}>Preview</p>
                <p style={{ fontSize: `${fontSize}px`, fontFamily, lineHeight: lineSpacing }} className={t.textSecondary}>
                  The BIM Chatbot helps you search and retrieve BIM documents instantly.
                </p>
              </div>
            </div>
          )}

          {/* Appearance Tab */}
          {settingsTab === "appearance" && (
            <div className="space-y-6">
              <h3 className={`font-semibold text-base ${t.textPrimary}`}>Appearance</h3>

              {/* Accent Color */}
              <div className="space-y-2">
                <label className={t.textPrimary}>Accent Color</label>
                <div className="flex gap-3 flex-wrap">
                  {ACCENT_COLORS.map((color, i) => (
                    <button
                      key={color.label}
                      onClick={() => setAccentIndex(i)}
                      title={color.label}
                      className={`w-8 h-8 rounded-full ${color.bg} transition-transform hover:scale-110 ${accentIndex === i ? "ring-2 ring-offset-2 ring-offset-stone-900 ring-white scale-110" : ""}`}
                    />
                  ))}
                </div>
                <p className={t.textMuted} style={{ fontSize: `${Math.max(fontSize - 2, 10)}px` }}>
                  Currently: {ACCENT_COLORS[accentIndex].label}
                </p>
              </div>

              {/* Bubble Style */}
              <div className="space-y-2">
                <label className={t.textPrimary}>Bubble Style</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["rounded", "square"] as BubbleStyle[]).map((style) => (
                    <button
                      key={style}
                      onClick={() => setBubbleStyle(style)}
                      className={`px-3 py-2 border transition-colors capitalize ${style === "rounded" ? "rounded-2xl" : "rounded-md"} ${bubbleStyle === style ? `${accent.active} ${accent.border} ${accent.text}` : `${t.inputBg} ${t.borderMid} ${t.textMuted}`}`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Density */}
              <div className="space-y-2">
                <label className={t.textPrimary}>Message Density</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["compact", "comfortable", "spacious"] as MessageDensity[]).map((d) => (
                    <button
                      key={d}
                      onClick={() => setMessageDensity(d)}
                      className={`px-3 py-2 rounded-xl border transition-colors capitalize ${messageDensity === d ? `${accent.active} ${accent.border} ${accent.text}` : `${t.inputBg} ${t.borderMid} ${t.textMuted}`}`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Width */}
              <div className="space-y-2">
                <label className={t.textPrimary}>Chat Width</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["narrow", "default", "wide"] as ChatWidth[]).map((w) => (
                    <button
                      key={w}
                      onClick={() => setChatWidth(w)}
                      className={`px-3 py-2 rounded-xl border transition-colors capitalize ${chatWidth === w ? `${accent.active} ${accent.border} ${accent.text}` : `${t.inputBg} ${t.borderMid} ${t.textMuted}`}`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sidebar Width */}
              <div className="space-y-2">
                <label className={t.textPrimary}>Sidebar Width</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["compact", "default"] as SidebarWidth[]).map((w) => (
                    <button
                      key={w}
                      onClick={() => setSidebarWidth(w)}
                      className={`px-3 py-2 rounded-xl border transition-colors capitalize ${sidebarWidth === w ? `${accent.active} ${accent.border} ${accent.text}` : `${t.inputBg} ${t.borderMid} ${t.textMuted}`}`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}