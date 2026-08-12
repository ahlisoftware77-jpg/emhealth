"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Minimize2,
  ScanText,
  CloudUpload,
  FolderKanban,
  ListTodo,
  Sliders,
  History,
  Settings,
  ShieldCheck,
  ChevronRight,
  Mail,
  PanelLeftClose,
  PanelLeftOpen
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "MCU Email Blast & Tools", href: "/mcu-email-blast", icon: Mail },
  { name: "Excel & Data Tools", href: "/excel-tools", icon: FileSpreadsheet },
  { name: "Image Batch Rename", href: "/image-rename", icon: FileText },
  { name: "Image Compression", href: "/image-compress", icon: Minimize2 },
  { name: "Image Utilities (OCR/Code)", href: "/image-utilities", icon: ScanText },
  { name: "Cloudinary Tools", href: "/cloudinary-tools", icon: CloudUpload },
  { name: "Storage Explorer", href: "/storage-explorer", icon: FolderKanban },
  { name: "Job Queue Monitor", href: "/job-queue", icon: ListTodo },
  { name: "Preset Manager", href: "/presets", icon: Sliders },
  { name: "Execution History", href: "/history", icon: History },
  { name: "Settings & Config", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAppStore();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  return (
    <aside
      className={`border-r border-border bg-card flex flex-col justify-between hidden md:flex h-screen sticky top-0 overflow-y-auto overflow-x-hidden transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      <div>
        {/* Header Logo & Collapse Toggle */}
        <div className={`h-16 flex items-center justify-between border-b border-border ${isCollapsed ? "px-3" : "px-5"}`}>
          {!isCollapsed && (
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-lg bg-foreground text-background flex items-center justify-center font-bold text-lg mr-3 shadow-md">
                D
              </div>
              <div>
                <h1 className="font-semibold text-sm tracking-tight leading-tight">Data Utility</h1>
                <span className="text-xs text-muted-foreground font-mono">Center v1.0</span>
              </div>
            </div>
          )}

          {isCollapsed && (
            <div className="w-8 h-8 rounded-lg bg-foreground text-background flex items-center justify-center font-bold text-lg shadow-md mx-auto">
              D
            </div>
          )}

          {/* TOGGLE BUTTON TO COLLAPSE/EXPAND SIDEBAR */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? "Perluas Menu Slide Kiri" : "Kecilkan Menu Slide Kiri (Minimize)"}
            className={`p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all border border-transparent hover:border-border ${
              isCollapsed ? "mt-2 mx-auto" : ""
            }`}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="w-5 h-5 text-emerald-400" />
            ) : (
              <PanelLeftClose className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                title={isCollapsed ? item.name : undefined}
                className={`flex items-center ${isCollapsed ? "justify-center px-2" : "justify-between px-3"} py-2.5 rounded-md text-xs font-medium transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  {!isCollapsed && <span>{item.name}</span>}
                </div>
                {!isCollapsed && isActive && <ChevronRight className="w-3.5 h-3.5 opacity-70" />}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer User Info */}
      <div className="p-3 border-t border-border">
        <div className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between"} p-2 rounded-lg bg-muted/60`}>
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0">
              {user?.name.charAt(0) || "A"}
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <p className="text-xs font-medium text-foreground truncate">{user?.name || "Admin User"}</p>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                  <span>{user?.role || "Super Admin"}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
