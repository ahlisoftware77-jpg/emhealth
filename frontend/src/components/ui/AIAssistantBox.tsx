"use client";

import { useState } from "react";
import { AIAPI } from "@/lib/api";
import { Sparkles, Bot, Send, Loader2, X, ChevronDown, ChevronUp } from "lucide-react";

interface AIAssistantBoxProps {
  title?: string;
  contextHint?: string;
  defaultPrompt?: string;
  placeholder?: string;
  onApplyResult?: (aiText: string) => void;
}

export function AIAssistantBox({
  title = "AI Smart Assistant",
  contextHint = "Minta bantuan AI untuk membuat template, saran konfigurasi, atau analisis data.",
  defaultPrompt = "",
  placeholder = "Ketik instruksi untuk AI di sini...",
  onApplyResult,
}: AIAssistantBoxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setResponse(null);
    try {
      const res = await AIAPI.chat(prompt);
      setResponse(res.response);
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.message || "Gagal menghubungi AI Assistant.";
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 shadow-sm transition-all overflow-hidden">
      {/* Header Toggle */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-purple-500/10 transition-all"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <span>{title}</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                AI Powered
              </span>
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">{contextHint}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs text-purple-400 font-medium">
          <span>{isOpen ? "Tutup AI" : "Buka AI Assistant"}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded Content */}
      {isOpen && (
        <div className="p-4 pt-0 space-y-3 border-t border-purple-500/20">
          <div className="flex gap-2">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={placeholder}
              className="flex-1 px-3 py-2 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-purple-500 text-foreground"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={loading || !prompt.trim()}
              className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-all disabled:opacity-50 flex items-center gap-1.5 shrink-0"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>Tanyakan AI</span>
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-xs">
              {error}
            </div>
          )}

          {response && (
            <div className="p-3.5 rounded-lg border border-purple-500/30 bg-purple-500/10 text-xs text-foreground space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-purple-300 text-[11px] flex items-center gap-1">
                  <Bot className="w-3.5 h-3.5" /> Saran AI Assistant:
                </span>
                {onApplyResult && (
                  <button
                    type="button"
                    onClick={() => onApplyResult(response)}
                    className="px-2 py-1 rounded bg-purple-600 text-white text-[10px] font-semibold hover:bg-purple-500 transition-all"
                  >
                    Gunakan Hasil AI Ini
                  </button>
                )}
              </div>
              <p className="whitespace-pre-wrap leading-relaxed text-[11px] opacity-95">{response}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
