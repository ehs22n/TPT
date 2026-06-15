import type { DragEventHandler, ReactNode } from "react";

export type ThemeMode = "light" | "dark";
export type AppPageId = "home" | "converter" | "ai" | "translate" | "speech";
export type MenuIconType = "dashboard" | "document" | "ai" | "translate" | "speech";

export interface MenuItem {
  id: AppPageId;
  title: string;
  icon: MenuIconType;
}

export interface Stats {
  folderName: string;
  outputPath: string;
}

export interface AppLayoutProps {
  activePage: AppPageId;
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  onNavigate: (page: AppPageId) => void;
  children: ReactNode;
  menuItems: MenuItem[];
}

export interface ConverterPanelProps {
  selectedFolder: string;
  outputPath: string;
  error: string;
  loading: boolean;
  stats: Stats | null;
  isDragging: boolean;
  onDragOver: DragEventHandler<HTMLDivElement>;
  onDragLeave: DragEventHandler<HTMLDivElement>;
  onDrop: DragEventHandler<HTMLDivElement>;
  onSelectFolder: () => void;
  onOpenOutput: () => void;
  getFileName: (fullPath: string) => string;
}

export interface AiPageProps {
  aiLogs: string[];
}

export interface HomePageProps {
  onNavigate: (page: AppPageId) => void;
}

export interface PlaceholderPageProps {
  icon: MenuIconType;
  title: string;
  description: string;
  items: string[];
}

export interface PageShellProps {
  title: string;
  tagline: string;
  children: ReactNode;
}
