"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { StorageAPI } from "@/lib/api";
import { 
  FolderKanban, 
  Download, 
  Trash2, 
  HardDrive, 
  RefreshCw, 
  FolderOpen, 
  ExternalLink,
  CheckCircle2
} from "lucide-react";

export default function StorageExplorerPage() {
  const [selectedFolder, setSelectedFolder] = useState<string>("output");
  const [openStatus, setOpenStatus] = useState<string | null>(null);

  const { data: statsData, refetch: refetchStats } = useQuery({
    queryKey: ["storageStats"],
    queryFn: StorageAPI.getStats,
  });

  const { data: filesData, isLoading, refetch: refetchFiles } = useQuery({
    queryKey: ["storageFiles", selectedFolder],
    queryFn: () => StorageAPI.listFiles(selectedFolder),
  });

  const handleOpenFolder = async (folderName: string) => {
    try {
      const res = await StorageAPI.openFolder(folderName);
      setOpenStatus(res.message);
      setTimeout(() => setOpenStatus(null), 4000);
    } catch (err: any) {
      alert(`Gagal membuka folder: ${err.response?.data?.detail || err.message}`);
    }
  };

  const handleClearFolder = async () => {
    if (confirm(`Apakah anda yakin ingin mengosongkan seluruh berkas pada folder ${selectedFolder}?`)) {
      await StorageAPI.clearFolder(selectedFolder);
      refetchFiles();
      refetchStats();
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const files = filesData?.files || [];
  const stats = statsData?.stats || { total_local_bytes: 0, upload_bytes: 0, output_bytes: 0, temp_bytes: 0, cache_bytes: 0 };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FolderKanban className="w-6 h-6 text-rose-500" />
            Local Storage File Explorer
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Penjelajah dan manajemen berkas pada direktori upload, output, temp, dan cache lokal server backend.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenFolder(selectedFolder)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white text-xs font-semibold transition-all shadow-sm"
          >
            <FolderOpen className="w-4 h-4" /> Buka Folder di Windows ({selectedFolder})
          </button>
          <button
            onClick={() => {
              refetchFiles();
              refetchStats();
            }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-card hover:bg-muted text-xs font-medium"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Files
          </button>
        </div>
      </div>

      {/* Quick Access Folders (D:\COMPRESS & Storage) */}
      <div className="bg-card border border-border rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
            <FolderOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-foreground">Akses Cepat Folder Kompresi D:\COMPRESS</h3>
            <p className="text-[11px] text-muted-foreground">Buka folder hasil output foto kompresi & foto asli secara langsung di File Explorer.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenFolder("compress_output")}
            className="px-3 py-1.5 rounded bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow"
          >
            <FolderOpen className="w-3.5 h-3.5" /> Open D:\COMPRESS\output
          </button>
          <button
            onClick={() => handleOpenFolder("compress_input")}
            className="px-3 py-1.5 rounded bg-muted hover:bg-muted/80 text-foreground border border-border text-xs font-medium transition-all flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Open D:\COMPRESS\foto asli
          </button>
        </div>
      </div>

      {openStatus && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-2 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{openStatus}</span>
        </div>
      )}

      {/* Storage Size Breakdown Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          onClick={() => setSelectedFolder("output")}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            selectedFolder === "output" ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-muted/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground block">Folder Output</span>
            <FolderOpen className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <span className="text-lg font-bold text-foreground font-mono">{formatSize(stats.output_bytes)}</span>
        </div>

        <div
          onClick={() => setSelectedFolder("upload")}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            selectedFolder === "upload" ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-muted/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground block">Folder Upload</span>
            <FolderOpen className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <span className="text-lg font-bold text-foreground font-mono">{formatSize(stats.upload_bytes)}</span>
        </div>

        <div
          onClick={() => setSelectedFolder("temp")}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            selectedFolder === "temp" ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-muted/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground block">Folder Temp</span>
            <FolderOpen className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <span className="text-lg font-bold text-foreground font-mono">{formatSize(stats.temp_bytes)}</span>
        </div>

        <div
          onClick={() => setSelectedFolder("cache")}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            selectedFolder === "cache" ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-muted/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground block">Folder Cache</span>
            <FolderOpen className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <span className="text-lg font-bold text-foreground font-mono">{formatSize(stats.cache_bytes)}</span>
        </div>
      </div>

      {/* File Table */}
      <div className="p-6 rounded-xl border border-border bg-card space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
            Berkas dalam Folder <span className="text-primary font-mono">/{selectedFolder}</span> ({files.length})
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenFolder(selectedFolder)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-muted hover:bg-muted/80 text-foreground border border-border text-xs font-medium transition-all"
            >
              <FolderOpen className="w-3.5 h-3.5 text-emerald-400" /> Buka Folder Ini di File Explorer
            </button>
            {files.length > 0 && (
              <button
                onClick={handleClearFolder}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white text-xs font-medium transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" /> Hapus Berkas Folder Ini
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-xs text-muted-foreground">Memuat berkas...</div>
        ) : files.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-lg">
            Folder ini kosong.
          </div>
        ) : (
          <div className="overflow-x-auto border border-border rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted text-muted-foreground uppercase font-medium border-b border-border">
                <tr>
                  <th className="p-3">Nama Berkas</th>
                  <th className="p-3">Ukuran</th>
                  <th className="p-3">Terakhir Diubah</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {files.map((file: any) => (
                  <tr key={file.name} className="hover:bg-muted/30">
                    <td className="p-3 font-medium text-foreground font-mono">{file.name}</td>
                    <td className="p-3 text-muted-foreground font-mono">{formatSize(file.size)}</td>
                    <td className="p-3 text-muted-foreground">
                      {new Date(file.modified_at * 1000).toLocaleString("id-ID")}
                    </td>
                    <td className="p-3 text-right">
                      <a
                        href={`http://localhost:8003/api/v1/storage/download/${file.name}`}
                        download
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-primary text-primary-foreground text-xs font-medium hover:opacity-90"
                      >
                        <Download className="w-3 h-3" /> Unduh
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
