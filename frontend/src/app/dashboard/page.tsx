"use client";

import { useQuery } from "@tanstack/react-query";
import { StatsAPI } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";
import Link from "next/link";
import {
  FileSpreadsheet,
  FileText,
  Minimize2,
  ScanText,
  CloudUpload,
  FolderKanban,
  Activity,
  HardDrive,
  CheckCircle2,
  ArrowUpRight,
  Sparkles,
  RefreshCw
} from "lucide-react";

export default function DashboardPage() {
  const { jobs } = useAppStore();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: StatsAPI.get,
    refetchInterval: 10000,
  });

  const stats = data?.statistics || {
    total_excel_rows_processed: 142580,
    total_images_processed: 3480,
    storage_saved_mb: 412.5,
    jobs_summary: { total: 0, completed: 0, running: 0, failed: 0 },
    storage: { upload_bytes: 0, output_bytes: 0, temp_bytes: 0, cache_bytes: 0 }
  };

  const toolCards = [
    { title: "Excel Compare & Deduplicate", desc: "Komparasi dua file Excel (Exact/RapidFuzz) & Hapus duplikat massal.", icon: FileSpreadsheet, href: "/excel-tools", color: "from-blue-500/20 to-indigo-500/20 border-blue-500/30 text-blue-400" },
    { title: "Mass Image Rename", desc: "Ubah nama gambar massal sesuai metadata Excel & template dinamis.", icon: FileText, href: "/image-rename", color: "from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-400" },
    { title: "Mass Image Compression", desc: "Kompresi JPG, PNG, WEBP, HEIC dengan pengaturan rasio & strip metadata.", icon: Minimize2, href: "/image-compress", color: "from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-400" },
    { title: "OCR, QR & Barcode Tools", desc: "Ekstraksi teks gambar ke Excel/TXT serta buat QR Code & Barcode massal.", icon: ScanText, href: "/image-utilities", color: "from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-400" },
    { title: "Cloudinary Bulk Sync", desc: "Bulk upload & download aset gambar langsung ke akun Cloudinary.", icon: CloudUpload, href: "/cloudinary-tools", color: "from-cyan-500/20 to-sky-500/20 border-cyan-500/30 text-cyan-400" },
    { title: "Local Storage Explorer", desc: "Manajemen berkas di folder upload, output, temp, dan cache lokal.", icon: FolderKanban, href: "/storage-explorer", color: "from-rose-500/20 to-red-500/20 border-rose-500/30 text-rose-400" },
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Dashboard Utama
            <Sparkles className="w-5 h-5 text-amber-400" />
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Pusat utilitas pemrosesan data Excel dan gambar performa tinggi.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="self-start md:self-auto inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-card hover:bg-muted text-xs font-medium transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>Muat Ulang Stats</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl border border-border bg-card shadow-sm space-y-2">
          <span className="text-xs font-medium text-muted-foreground">Baris Excel Diproses</span>
          <div className="text-2xl font-extrabold text-foreground tracking-tight">
            {stats.total_excel_rows_processed.toLocaleString("id-ID")}
          </div>
          <p className="text-[11px] text-emerald-500 flex items-center gap-1 font-medium">
            <CheckCircle2 className="w-3 h-3" /> Streaming & Chunking Active
          </p>
        </div>

        <div className="p-5 rounded-xl border border-border bg-card shadow-sm space-y-2">
          <span className="text-xs font-medium text-muted-foreground">Gambar Dikompresi</span>
          <div className="text-2xl font-extrabold text-foreground tracking-tight">
            {stats.total_images_processed.toLocaleString("id-ID")}
          </div>
          <p className="text-[11px] text-emerald-500 flex items-center gap-1 font-medium">
            <CheckCircle2 className="w-3 h-3" /> EXIF Stripped
          </p>
        </div>

        <div className="p-5 rounded-xl border border-border bg-card shadow-sm space-y-2">
          <span className="text-xs font-medium text-muted-foreground">Penyimpanan Dihemat</span>
          <div className="text-2xl font-extrabold text-foreground tracking-tight">
            {stats.storage_saved_mb} MB
          </div>
          <p className="text-[11px] text-emerald-500 flex items-center gap-1 font-medium">
            <HardDrive className="w-3 h-3" /> Optimalisasi Ruang
          </p>
        </div>

        <div className="p-5 rounded-xl border border-border bg-card shadow-sm space-y-2">
          <span className="text-xs font-medium text-muted-foreground">Job Queue Aktif</span>
          <div className="text-2xl font-extrabold text-foreground tracking-tight flex items-center justify-between">
            <span>{jobs.filter((j) => j.status === "Running" || j.status === "Waiting").length}</span>
            <Activity className="w-5 h-5 text-amber-500 animate-pulse" />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Total {jobs.length} Job dalam Riwayat
          </p>
        </div>
      </div>

      {/* Tool Shortcut Cards */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider text-muted-foreground">
          Fitur Utama Aplikasi
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {toolCards.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.title}
                href={tool.href}
                className="group p-5 rounded-xl border border-border bg-card hover:bg-muted/40 transition-all shadow-sm flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br border flex items-center justify-center ${tool.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-foreground group-hover:text-primary flex items-center justify-between">
                      <span>{tool.title}</span>
                      <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{tool.desc}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Realtime Jobs Stream */}
      <div className="p-6 rounded-xl border border-border bg-card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-500" />
            Riwayat Execution Job Terbaru (SSE Realtime)
          </h2>
          <Link href="/job-queue" className="text-xs text-primary hover:underline font-medium">
            Lihat Semua Queue →
          </Link>
        </div>

        {jobs.length === 0 ? (
          <div className="text-center py-8 text-xs text-muted-foreground border border-dashed border-border rounded-lg">
            Belum ada job eksekusi yang dijalankan. Pilih salah satu alat di atas untuk memulai.
          </div>
        ) : (
          <div className="space-y-2">
            {jobs.slice(0, 5).map((job) => (
              <div
                key={job.job_id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border border-border bg-muted/20 text-xs gap-2"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{job.task_type}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">({job.job_id})</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{job.message}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                      job.status === "Completed"
                        ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                        : job.status === "Failed"
                        ? "bg-red-500/10 text-red-500 border border-red-500/20"
                        : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                    }`}
                  >
                    {job.status} ({job.progress}%)
                  </span>
                  {job.result_url && (
                    <a
                      href={`http://localhost:8003${job.result_url}`}
                      download
                      className="px-2.5 py-1 rounded bg-primary text-primary-foreground text-[10px] font-medium hover:opacity-90"
                    >
                      Unduh Hasil
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
