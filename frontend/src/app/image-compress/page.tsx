"use client";

import { useState } from "react";
import { FileUploader } from "@/components/ui/FileUploader";
import { ImageAPI } from "@/lib/api";
import { Minimize2, Sliders, Zap, AlertCircle } from "lucide-react";
import { AIAssistantBox } from "@/components/ui/AIAssistantBox";

export default function ImageCompressPage() {
  const [images, setImages] = useState<File[]>([]);
  const [quality, setQuality] = useState<number>(80);
  const [targetFormat, setTargetFormat] = useState<string>("WEBP");
  const [maxWidth, setMaxWidth] = useState<string>("");
  const [maxHeight, setMaxHeight] = useState<string>("");
  const [removeMetadata, setRemoveMetadata] = useState<boolean>(true);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleCompress = async () => {
    if (images.length === 0) {
      setMessage("Silakan upload sekurangnya 1 berkas gambar terlebih dahulu.");
      return;
    }
    setIsProcessing(true);
    setMessage(null);
    try {
      await ImageAPI.upload(images);
      const res = await ImageAPI.compress({
        image_names: images.map((f) => f.name),
        quality,
        max_width: maxWidth ? Number(maxWidth) : null,
        max_height: maxHeight ? Number(maxHeight) : null,
        target_format: targetFormat,
        remove_metadata: removeMetadata,
        output_target: "zip",
      });

      setMessage(`Job Kompresi Gambar telah dijadwalkan (ID: ${res.job.job_id}). Pantau di Job Queue.`);
    } catch (err: any) {
      setMessage(`Gagal memproses kompresi: ${err.message}`);
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
          <h2 className="text-sm font-semibold text-foreground">Upload Berkas Gambar Massal</h2>
          <FileUploader
            accept={{ "image/*": [".jpg", ".jpeg", ".png", ".webp", ".bmp", ".heic"] }}
            label="Tarik & lepas berkas gambar di sini (JPG, PNG, WEBP, BMP, HEIC)"
            multiple={true}
            onFilesSelected={(files) => setImages(files)}
          />
        </div>

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
    </div>
  );
}
