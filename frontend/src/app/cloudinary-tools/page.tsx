"use client";

import { useState } from "react";
import { FileUploader } from "@/components/ui/FileUploader";
import { CloudinaryAPI, ImageAPI } from "@/lib/api";
import { CloudUpload, Download, AlertCircle, Folder } from "lucide-react";

export default function CloudinaryToolsPage() {
  const [activeTab, setActiveTab] = useState<"upload" | "download">("upload");

  // Upload State
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [folderPath, setFolderPath] = useState<string>("data_utility_center");
  const [tagsStr, setTagsStr] = useState<string>("production, bulk");

  // Download State
  const [downloadUrls, setDownloadUrls] = useState<string>("https://res.cloudinary.com/demo/image/upload/sample.jpg");

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleUpload = async () => {
    if (uploadFiles.length === 0) {
      setMessage("Upload sekurangnya 1 gambar untuk dikirim ke Cloudinary.");
      return;
    }
    setIsProcessing(true);
    setMessage(null);
    try {
      await ImageAPI.upload(uploadFiles);
      const res = await CloudinaryAPI.bulkUpload({
        file_names: uploadFiles.map((f) => f.name),
        folder_path: folderPath,
        tags: tagsStr.split(",").map((s) => s.trim()),
      });

      setMessage(`Job Bulk Upload Cloudinary telah dijadwalkan (ID: ${res.job.job_id}).`);
    } catch (err: any) {
      setMessage(`Gagal upload: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    const urls = downloadUrls
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (urls.length === 0) {
      setMessage("Masukkan sekurangnya 1 URL gambar Cloudinary.");
      return;
    }
    setIsProcessing(true);
    setMessage(null);
    try {
      const res = await CloudinaryAPI.bulkDownload(urls);
      setMessage(`Job Bulk Download Cloudinary dijadwalkan (ID: ${res.job.job_id}). Hasil ZIP akan tersedia.`);
    } catch (err: any) {
      setMessage(`Gagal download: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Title */}
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <CloudUpload className="w-6 h-6 text-cyan-400" />
          Cloudinary Management Suite
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Sinkronisasi gambar massal ke penyimpanan Cloudinary utama dan unduh aset berformat ZIP.
        </p>
      </div>

      {message && (
        <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 text-xs text-foreground flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-primary shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Subtabs */}
      <div className="flex border-b border-border space-x-2">
        <button
          onClick={() => setActiveTab("upload")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
            activeTab === "upload" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <CloudUpload className="w-4 h-4" /> Bulk Upload ke Cloudinary
        </button>
        <button
          onClick={() => setActiveTab("download")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
            activeTab === "download" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Download className="w-4 h-4" /> Bulk Download Aset Cloudinary (ZIP)
        </button>
      </div>

      {activeTab === "upload" ? (
        <div className="max-w-2xl mx-auto p-6 rounded-xl border border-border bg-card space-y-5">
          <h2 className="text-sm font-semibold text-foreground">Bulk Upload Cloudinary</h2>
          <FileUploader
            accept={{ "image/*": [".jpg", ".png", ".webp", ".heic"] }}
            label="Upload file gambar massal untuk dikirim ke Cloudinary"
            multiple={true}
            onFilesSelected={(files) => setUploadFiles(files)}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Target Folder Cloudinary:</label>
              <input
                type="text"
                value={folderPath}
                onChange={(e) => setFolderPath(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-md border border-border bg-background font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Tag Aset (pisahkan koma):</label>
              <input
                type="text"
                value={tagsStr}
                onChange={(e) => setTagsStr(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-md border border-border bg-background"
              />
            </div>
          </div>

          <button
            onClick={handleUpload}
            disabled={isProcessing}
            className="w-full py-2.5 rounded-md bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 transition-all"
          >
            {isProcessing ? "Mengunggah..." : "Unggah Massal ke Cloudinary"}
          </button>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto p-6 rounded-xl border border-border bg-card space-y-5">
          <h2 className="text-sm font-semibold text-foreground">Bulk Download dari URL Cloudinary</h2>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              Daftar URL Aset Cloudinary (satu URL per baris):
            </label>
            <textarea
              rows={6}
              value={downloadUrls}
              onChange={(e) => setDownloadUrls(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-md border border-border bg-background font-mono"
            />
          </div>

          <button
            onClick={handleDownload}
            disabled={isProcessing}
            className="w-full py-2.5 rounded-md bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 transition-all"
          >
            {isProcessing ? "Mendownload Aset..." : "Unduh Paket Aset ZIP"}
          </button>
        </div>
      )}
    </div>
  );
}
