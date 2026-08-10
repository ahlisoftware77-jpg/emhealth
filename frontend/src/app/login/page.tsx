"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthAPI } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";
import { Lock, Mail, ShieldCheck, Sparkles, ArrowRight, AlertCircle, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAppStore((state) => state.setUser);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Email dan password wajib diisi.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await AuthAPI.login(email, password);
      if (res.status === "success" && res.user) {
        if (res.token) {
          localStorage.setItem("auth_token", res.token);
        }
        setUser(res.user);
        router.push("/dashboard");
      } else {
        setError("Gagal masuk. Silakan periksa kembali kredensial Anda.");
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Terjadi kesalahan server saat login.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Brand & Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 text-primary mb-2">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center justify-center gap-2">
            Data Utility Center
            <Sparkles className="w-4 h-4 text-amber-400" />
          </h1>
          <p className="text-xs text-muted-foreground">
            Masuk untuk mengakses sistem pengolahan data Excel & Gambar massal.
          </p>
        </div>

        {/* Login Form Card */}
        <div className="p-6 sm:p-8 rounded-2xl border border-border bg-card shadow-xl space-y-6">
          {error && (
            <div className="p-3.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

            <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-900 dark:text-slate-100">Email / Username</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="admin@datautility.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-border bg-background dark:bg-slate-900/80 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all font-medium"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-900 dark:text-slate-100">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-border bg-background dark:bg-slate-900/80 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all font-medium"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Demo Credentials Helper */}
          <div className="pt-4 border-t border-border space-y-2">
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 text-center">
              Akses Cepat Super Admin:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin("triyadi72@gmail.com", "admin123")}
                className="p-2.5 rounded-lg border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-[11px] text-left transition-all space-y-0.5"
              >
                <div className="font-semibold text-purple-300">Triyadi (Super Admin)</div>
                <div className="text-[10px] text-slate-400 font-mono">triyadi72@gmail.com</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin("user@datautility.com", "user123")}
                className="p-2.5 rounded-lg border border-border bg-slate-100/50 dark:bg-slate-800/60 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 text-[11px] text-left transition-all space-y-0.5"
              >
                <div className="font-semibold text-slate-900 dark:text-slate-100">Operator User</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">user123</div>
              </button>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-center text-slate-500 dark:text-slate-400">
          Data Utility Center v1.0 • High Performance Engine
        </p>
      </div>
    </div>
  );
}
