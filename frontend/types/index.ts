import type { ForgeModel } from "@/utils/forge";

export type Message = {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  fileNames?: string[];
  forgeModels?: ForgeModel[];
  replyTo?: string;
  citations?: { text: string; page: number }[];
  imageUrl?: string;

  chartData?: any;
  documentUrl?: string;
};

export type Chat = {
  id: number;
  title: string;
  messages: Message[];
};

export type Screen = "login" | "register" | "chat";
export type SettingsTab = "profile" | "accessibility" | "appearance";
export type Theme = "dark" | "light";
export type BubbleStyle = "rounded" | "square";
export type MessageDensity = "compact" | "comfortable" | "spacious";
export type ChatWidth = "narrow" | "default" | "wide";
export type SidebarWidth = "compact" | "default";