"use client";

import { useState } from "react";
import { FileUploader } from "@/components/ui/FileUploader";
import { ImageAPI } from "@/lib/api";
import { Minimize2, Sliders, Zap, AlertCircle, FolderOpen, ImageIcon, Loader2 } from "lucide-react";
import { AIAssistantBox } from "@/components/ui/AIAssistantBox";
import { LocalFolderBrowser } from "@/components/ui/LocalFolderBrowser";

export default function ImageCompressPage() {
  const [images, setImages] = useState<File[]>([]);
  const [uploadMode, setUploadMode] = useState<"file" | "folder" | "local">("file");
  const [localSourceDir, setLocalSourceDir] = useState<string>("");
  const [localOutputDir, setLocalOutputDir] = useState<string>("");
  
  const [isSourceBrowserOpen, setIsSourceBrowserOpen] = useState(false);
  const [isOutputBrowserOpen, setIsOutputBrowserOpen] = useState(false);
  
  const [previewImages, setPreviewImages] = useState<any[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  
  const [quality, setQuality] = useState<number>(80);
  const [targetFormat, setTargetFormat] = useState<string>("WEBP");
  const [maxWidth, setMaxWidth] = useState<string>("");
  const [maxHeight, setMaxHeight] = useState<string>("");
  const [removeMetadata, setRemoveMetadata] = useState<boolean>(true);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadPreviewImages = async (path: string) => {
    if (!path) {
      setPreviewImages([]);
      return;
    }
    setLoadingPreview(true);
    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8003"}/api/v1/local-file/images-in-directory?path=${encodeURIComponent(path)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setPreviewImages(data.images.slice(0, 100)); // Batasi max 100 gambar
      }
    } catch (err) {
      console.error("Gagal load preview gambar", err);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleCompress = async () => {
    if (uploadMode !== "local" && images.length === 0) {
      setMessage("Silakan upload sekurangnya 1 berkas gambar terlebih dahulu.");
      return;
    }
    if (uploadMode === "local" && !localSourceDir) {
      setMessage("Silakan masukkan Path Folder Asal terlebih dahulu.");
      return;
    }

    setIsProcessing(true);
    setMessage(null);
    try {
      if (uploadMode !== "local") {
        await ImageAPI.upload(images);
      }
      
      const res = await ImageAPI.compress({
        source_mode: uploadMode === "local" ? "local" : "uploaded",
        image_names: uploadMode !== "local" ? images.map((f) => f.name) : [],
        local_paths: uploadMode === "local" ? [localSourceDir] : [],
        quality,
        max_width: maxWidth ? Number(maxWidth) : null,
        max_height: maxHeight ? Number(maxHeight) : null,
        target_format: targetFormat,
        remove_metadata: removeMetadata,
        output_target: uploadMode === "local" ? "local" : "zip",
        output_dir: uploadMode === "local" ? localOutputDir : undefined,
      });

      setMessage(`Job Kompresi Gambar telah dijadwalkan (ID: ${res.job.job_id}). Pantau di Job Queue.`);
    } catch (err: any) {
      setMessage(`Gagal memproses kompresi: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLocalCompress = async () => {
    setIsProcessing(true);
    setMessage(null);
    try {
      const res = await ImageAPI.runLocalScript();
      setMessage(`Proses lokal dijadwalkan (ID: ${res.job.job_id}). Pantau di Job Queue.`);
    } catch (err: any) {
      if (err.response?.data?.detail) {
        setMessage(`Error: ${err.response.data.detail}`);
      } else {
        setMessage(`Gagal menjalankan script lokal: ${err.message}`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Title */}
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Minimize2 className="w-6 h-6 text-emerald-400" />
          Mass Image Compression & Optimization
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Kompresi gambar massal (JPG, PNG, WEBP, HEIC) dengan pembersihan EXIF metadata & rasio kualitas kustom.
        </p>
      </div>

      {/* AI Smart Compression Assistant */}
      <AIAssistantBox
        title="AI Image Optimizer Assistant"
        contextHint="Minta AI memberikan rekomendasi kualitas kompresi & format (WEBP/PNG/JPG) terbaik sesuai penggunaan web Anda."
        placeholder="misal: 'Rekomendasikan kualitas kompresi terbaik untuk toko online E-Commerce agar cepat dimuat'"
        onApplyResult={(text) => {
          if (text.toLowerCase().includes("webp")) setTargetFormat("WEBP");
          if (text.includes("85")) setQuality(85);
          else if (text.includes("75")) setQuality(75);
        }}
      />

      {message && (
        <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 text-xs text-foreground flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-primary shrink-0" />
          <span>{message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Box */}
        <div className="lg:col-span-2 p-6 rounded-xl border border-border bg-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-foreground">Sumber Gambar</h2>
            <div className="flex items-center gap-1 bg-muted p-1 rounded-lg border border-border">
              <button
                onClick={() => setUploadMode("file")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  uploadMode === "file" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Pilih File Satuan
              </button>
              <button
                onClick={() => setUploadMode("folder")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  uploadMode === "folder" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Pilih Seluruh Folder
              </button>
              <button
                onClick={() => setUploadMode("local")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  uploadMode === "local" ? "bg-emerald-500 text-slate-950 shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Proses Folder Lokal
              </button>
            </div>
          </div>
          
          {uploadMode !== "local" ? (
            <>
              <FileUploader
                accept={{ "image/*": [".jpg", ".jpeg", ".png", ".webp", ".bmp", ".heic"] }}
                label={uploadMode === "folder" ? "Klik di sini untuk memilih Folder (semua gambar di dalamnya akan dibaca)" : "Tarik & lepas berkas gambar di sini atau klik untuk memilih file"}
                multiple={true}
                allowDirectory={uploadMode === "folder"}
                onFilesSelected={(files) => setImages(files)}
              />

              <div className="text-[11px] text-muted-foreground bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20 mt-4 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <p>
                  <strong className="text-emerald-400 font-semibold block mb-0.5">Mengenai Folder Output:</strong> 
                  Demi keamanan browser, aplikasi Cloud tidak dapat langsung menulis file ke dalam partisi lokal Anda (seperti D:\). Oleh karena itu, hasil gambar yang telah di-compress akan otomatis dikemas menjadi satu file <strong>.ZIP</strong>. Anda akan dapat mengunduhnya dan memilih lokasi penyimpanan (Folder Output) melalui dialog "Save As" bawaan komputer Anda.
                </p>
              </div>
            </>
          ) : (
            <div className="space-y-4 pt-2">
              <div className="text-[11px] text-muted-foreground bg-amber-500/10 p-3 rounded-lg border border-amber-500/20 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p>
                  <strong className="text-amber-500 font-semibold block mb-0.5">Mode Lokal Aktif:</strong>
                  Backend akan langsung membaca dan menulis file dari/ke direktori lokal PC Anda tanpa proses upload/download. Path yang Anda ketik di bawah harus valid.
                </p>
              </div>
              
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Path Folder Asal (Sumber Foto):</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={localSourceDir}
                    onChange={(e) => setLocalSourceDir(e.target.value)}
                    placeholder="Contoh: D:\Photos\Original"
                    className="flex-1 px-3 py-2 text-xs rounded-md border border-border bg-background font-mono"
                  />
                  <button
                    onClick={() => setIsSourceBrowserOpen(true)}
                    className="px-3 py-2 bg-secondary text-secondary-foreground text-xs rounded-md font-semibold hover:bg-secondary/80 transition-colors flex items-center gap-2 shrink-0"
                  >
                    <FolderOpen className="w-4 h-4" />
                    Browse...
                  </button>
                </div>
              </div>

              {localSourceDir && (
                <div className="mt-4 border border-border rounded-lg p-3 bg-muted/20">
                  <h3 className="text-xs font-semibold flex items-center gap-2 mb-3">
                    <ImageIcon className="w-4 h-4 text-emerald-500" />
                    Preview Gambar (Maks 100)
                    {loadingPreview && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground ml-2" />}
                  </h3>
                  
                  {!loadingPreview && previewImages.length === 0 ? (
                    <div className="text-xs text-muted-foreground italic text-center p-4">
                      Tidak ditemukan gambar yang didukung (.jpg, .png, .webp, .heic) di folder ini.
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-[250px] overflow-y-auto pr-1">
                      {previewImages.map((img, idx) => (
                        <div key={idx} className="group relative aspect-square bg-muted rounded-md overflow-hidden border border-border">
                          <img 
                            src={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8003"}/api/v1/local-file/preview?path=${encodeURIComponent(img.path)}`}
                            alt={img.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            loading="lazy"
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1 translate-y-full group-hover:translate-y-0 transition-transform">
                            <p className="text-[9px] text-white truncate" title={img.name}>{img.name}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Path Folder Tujuan Output (Opsional):</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={localOutputDir}
                    onChange={(e) => setLocalOutputDir(e.target.value)}
                    placeholder="Bila dikosongkan, backend akan membuat folder Temp"
                    className="flex-1 px-3 py-2 text-xs rounded-md border border-border bg-background font-mono"
                  />
                  <button
                    onClick={() => setIsOutputBrowserOpen(true)}
                    className="px-3 py-2 bg-secondary text-secondary-foreground text-xs rounded-md font-semibold hover:bg-secondary/80 transition-colors flex items-center gap-2 shrink-0"
                  >
                    <FolderOpen className="w-4 h-4" />
                    Browse...
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <LocalFolderBrowser
          isOpen={isSourceBrowserOpen}
          onClose={() => setIsSourceBrowserOpen(false)}
          title="Pilih Folder Asal Gambar"
          onSelect={(path) => {
            setLocalSourceDir(path);
            loadPreviewImages(path);
          }}
        />

        <LocalFolderBrowser
          isOpen={isOutputBrowserOpen}
          onClose={() => setIsOutputBrowserOpen(false)}
          title="Pilih Folder Tujuan Hasil Kompresi"
          onSelect={(path) => setLocalOutputDir(path)}
        />

        {/* Compression Controls */}
        <div className="p-6 rounded-xl border border-border bg-card space-y-5">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-500" />
            Pengaturan Kompresi
          </h2>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              Tingkat Kualitas (Quality): <span className="font-bold text-primary">{quality}%</span>
            </label>
            <input
              type="range"
              min="10"
              max="100"
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Format Target Output:</label>
            <select
              value={targetFormat}
              onChange={(e) => setTargetFormat(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-md border border-border bg-background"
            >
              <option value="WEBP">WEBP (Sangat Ringan, Direkomendasikan)</option>
              <option value="JPEG">JPEG / JPG</option>
              <option value="PNG">PNG (Kompresi Lossless)</option>
              <option value="original">Pertahankan Format Asli</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Max Lebar (px):</label>
              <input
                type="number"
                value={maxWidth}
                onChange={(e) => setMaxWidth(e.target.value)}
                placeholder="misal: 1920"
                className="w-full px-3 py-2 text-xs rounded-md border border-border bg-background"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Max Tinggi (px):</label>
              <input
                type="number"
                value={maxHeight}
                onChange={(e) => setMaxHeight(e.target.value)}
                placeholder="misal: 1080"
                className="w-full px-3 py-2 text-xs rounded-md border border-border bg-background"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="exif"
              checked={removeMetadata}
              onChange={(e) => setRemoveMetadata(e.target.checked)}
              className="rounded border-border"
            />
            <label htmlFor="exif" className="text-xs text-foreground cursor-pointer">
              Hapus Metadata EXIF (Lokasi, Kamera, Tanggal)
            </label>
          </div>

          <button
            onClick={handleCompress}
            disabled={isProcessing}
            className="w-full py-2.5 rounded-md bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 transition-all flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4" />
            <span>{isProcessing ? "Mengompresi Gambar..." : "Mulai Kompresi Massal"}</span>
          </button>
        </div>
      </div>

      {/* Local Script Execution Card */}
      <div className="bg-card border border-emerald-500/30 rounded-xl p-5 md:p-6 shadow-lg shadow-emerald-500/5 mt-8">
        <h2 className="text-sm font-bold text-emerald-500 flex items-center gap-2 mb-2">
          <Zap className="w-4 h-4" />
          Kompresi Ekstrem (Skala Gigabyte / Mode Offline)
        </h2>
        <p className="text-xs text-muted-foreground mb-4">
          Gunakan fitur ini jika Anda memiliki ribuan foto (lebih dari 1GB). Fitur ini akan langsung memicu eksekusi *script* Python 
          <code> manual/compress_images.py </code> yang akan membaca file dari <code> D:\COMPRESS\foto asli </code> 
          dan menyimpannya di <code> D:\COMPRESS\output </code> secara otomatis.
        </p>
        
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-500 mb-4 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <strong>Syarat Penting:</strong> Tombol ini HANYA BISA BERFUNGSI jika Anda sedang menjalankan aplikasi Web ini di komputer Anda sendiri (Localhost). 
            Jika Anda membukanya melalui Vercel, server akan menolak akses tersebut.
          </div>
        </div>

        <button
          onClick={handleLocalCompress}
          disabled={isProcessing}
          className="w-full py-2.5 rounded-md bg-emerald-500 text-white font-semibold text-xs hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
        >
          <Zap className="w-4 h-4" />
          <span>{isProcessing ? "Memicu Eksekusi..." : "Jalankan Kompresi Massal (Mode Lokal)"}</span>
        </button>
      </div>
    </div>
  );
}
