"use client";

import React, { useState, useEffect } from "react";
import { Folder, HardDrive, CornerLeftUp, X, Check, Loader2 } from "lucide-react";

interface LocalFolderBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (path: string) => void;
  title?: string;
}

export function LocalFolderBrowser({ isOpen, onClose, onSelect, title = "Pilih Folder Lokal" }: LocalFolderBrowserProps) {
  const [currentPath, setCurrentPath] = useState<string>("");
  const [contents, setContents] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadDirectory(currentPath);
    }
  }, [isOpen]);

  const loadDirectory = async (path: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8003"}/api/v1/local-file/list-directory?path=${encodeURIComponent(path)}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("Gagal memuat direktori");
      }
      const data = await res.json();
      setCurrentPath(data.path);
      setContents(data.contents);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = () => {
    if (currentPath) {
      onSelect(currentPath);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-card border border-border w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Folder className="w-5 h-5 text-emerald-500" />
            {title}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Path Input / Display */}
        <div className="p-3 border-b border-border bg-background flex gap-2">
          <input
            type="text"
            value={currentPath}
            onChange={(e) => setCurrentPath(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadDirectory(currentPath)}
            className="flex-1 px-3 py-1.5 text-xs bg-muted border border-border rounded-md font-mono"
            placeholder="C:\ atau D:\"
          />
          <button 
            onClick={() => loadDirectory(currentPath)}
            className="px-3 py-1.5 bg-secondary text-secondary-foreground text-xs rounded-md font-semibold hover:bg-secondary/80 transition-colors"
          >
            Go
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-2 bg-card min-h-[300px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
              <span className="text-xs">Memuat direktori...</span>
            </div>
          ) : error ? (
            <div className="p-4 text-center text-xs text-red-400 bg-red-400/10 rounded border border-red-400/20 m-2">
              {error}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {contents.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    if (item.type !== "file") {
                      loadDirectory(item.path);
                    }
                  }}
                  className={`flex items-center gap-3 p-2.5 rounded-lg border border-transparent hover:bg-muted/50 transition-colors cursor-pointer group ${
                    item.type === "file" ? "opacity-50 cursor-default" : "hover:border-border"
                  }`}
                >
                  <div className="shrink-0 text-muted-foreground group-hover:text-emerald-400 transition-colors">
                    {item.type === "parent" ? (
                      <CornerLeftUp className="w-5 h-5" />
                    ) : item.type === "drive" ? (
                      <HardDrive className="w-5 h-5" />
                    ) : (
                      <Folder className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate" title={item.name}>
                      {item.type === "parent" ? "Kembali (Up)" : item.name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/30 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSelect}
            disabled={!currentPath || loading}
            className="px-4 py-2 bg-emerald-500 text-slate-950 text-xs font-bold rounded-md hover:bg-emerald-400 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="w-4 h-4" />
            Pilih Folder Ini
          </button>
        </div>
      </div>
    </div>
  );
}
