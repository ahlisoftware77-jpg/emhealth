"use client";

import { useAppStore } from "@/store/useAppStore";
import { Moon, Sun, Activity, Sparkles, LogOut, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function Navbar() {
  const router = useRouter();
  const { theme, toggleTheme, jobs, user, logout } = useAppStore();
  const activeJobs = jobs.filter((j) => j.status === "Running" || j.status === "Waiting");

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Production API Connected
        </span>
      </div>

      <div className="flex items-center space-x-3">
        {/* Active Jobs Counter Badge */}
        <Link
          href="/job-queue"
          className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted hover:bg-muted/80 text-xs text-foreground font-medium transition-all"
        >
          <Activity className={`w-3.5 h-3.5 ${activeJobs.length > 0 ? "text-amber-500 animate-spin" : "text-muted-foreground"}`} />
          <span>Job Queue</span>
          {activeJobs.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-500 text-black font-bold text-[10px]">
              {activeJobs.length} Running
            </span>
          )}
        </Link>

        {/* Dark/Light Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
          title="Ubah Tema (Dark/Light)"
        >
          {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
        </button>

        <div className="h-4 w-[1px] bg-border mx-1" />

        {/* User Info & Logout Button */}
        {user ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-muted/50 border border-border text-xs">
              <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[10px]">
                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="font-semibold text-foreground leading-tight text-[11px]">{user.name}</span>
                <span className="text-[9px] text-muted-foreground">{user.role}</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-all"
              title="Keluar (Logout)"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-sm"
          >
            <User className="w-3.5 h-3.5" />
            <span>Masuk</span>
          </Link>
        )}
      </div>
    </header>
  );
}

