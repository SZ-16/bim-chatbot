import { MessageDensity, ChatWidth, SidebarWidth } from "@/types";

export const ACCENT_COLORS = [
  { label: "Amber",  bg: "bg-amber-500",   hover: "hover:bg-amber-600",   text: "text-amber-400",   border: "border-amber-500",   active: "bg-amber-500/20", hex: "#f59e0b" },
  { label: "Blue",   bg: "bg-blue-500",    hover: "hover:bg-blue-600",    text: "text-blue-400",    border: "border-blue-500",    active: "bg-blue-500/20",  hex: "#3b82f6" },
  { label: "Green",  bg: "bg-emerald-500", hover: "hover:bg-emerald-600", text: "text-emerald-400", border: "border-emerald-500", active: "bg-emerald-500/20",hex: "#10b981" },
  { label: "Purple", bg: "bg-violet-500",  hover: "hover:bg-violet-600",  text: "text-violet-400",  border: "border-violet-500",  active: "bg-violet-500/20", hex: "#8b5cf6" },
  { label: "Rose",   bg: "bg-rose-500",    hover: "hover:bg-rose-600",    text: "text-rose-400",    border: "border-rose-500",    active: "bg-rose-500/20",   hex: "#f43f5e" },
  { label: "Cyan",   bg: "bg-cyan-500",    hover: "hover:bg-cyan-600",    text: "text-cyan-400",    border: "border-cyan-500",    active: "bg-cyan-500/20",   hex: "#06b6d4" },
];

export const DENSITY_MAP: Record<MessageDensity, { gap: string; px: string; py: string }> = {
  compact:     { gap: "space-y-2", px: "px-3", py: "py-1" },
  comfortable: { gap: "space-y-4", px: "px-4", py: "py-2" },
  spacious:    { gap: "space-y-6", px: "px-5", py: "py-3" },
};

export const CHAT_WIDTH_MAP: Record<ChatWidth, string> = {
  narrow:  "max-w-lg",
  default: "max-w-2xl",
  wide:    "max-w-4xl",
};

export const SIDEBAR_WIDTH_MAP: Record<SidebarWidth, string> = {
  compact: "w-48",
  default: "w-64",
};