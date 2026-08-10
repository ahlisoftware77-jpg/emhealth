"use client";

import { useState } from "react";
import { FileUploader } from "@/components/ui/FileUploader";
import { ImageAPI, ExcelAPI } from "@/lib/api";
import { FileText, Eye, Play, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import { AIAssistantBox } from "@/components/ui/AIAssistantBox";

export default function ImageRenamePage() {
  const [images, setImages] = useState<File[]>([]);
  const [excelFile, setExcelFile] = useState<File | null>(null);

  // Rename config
  const [template, setTemplate] = useState<string>("{Nama}_{NIK}_{RunningNumber}");
  const [matchCol, setMatchCol] = useState<string>("NIK");
  const [prefix, setPrefix] = useState<string>("");
  const [suffix, setSuffix] = useState<string>("");
  const [regexPattern, setRegexPattern] = useState<string>("");
  const [regexReplace, setRegexReplace] = useState<string>("");
  const [caseTransform, setCaseTransform] = useState<"none" | "uppercase" | "lowercase" | "titlecase">("uppercase");

  const [previewData, setPreviewData] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleGeneratePreview = async () => {
    if (images.length === 0 || !excelFile) {
      setMessage("Upload file gambar dan file metadata Excel terlebih dahulu.");
      return;
    }
    setIsProcessing(true);
    setMessage(null);
    try {
      // Upload excel file first
      await ExcelAPI.upload([excelFile]);
      const sampleNames = images.slice(0, 10).map((f) => f.name);

      const res = await ImageAPI.previewRename({
        sample_images: sampleNames,
        excel_file_name: excelFile.name,
        template,
        match_excel_column: matchCol,
        prefix,
        suffix,
        regex_pattern: regexPattern || null,
        regex_replace: regexReplace || null,
        case_transform: caseTransform,
      });

      setPreviewData(res.preview || []);
      setMessage("Pratinjau nama gambar berhasil dibuat.");
    } catch (err: any) {
      setMessage(`Gagal membuat pratinjau: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExecuteRename = async () => {
    if (images.length === 0 || !excelFile) {
      setMessage("Upload file gambar dan file metadata Excel terlebih dahulu.");
      return;
    }
    setIsProcessing(true);
    setMessage(null);
    try {
      // Upload all images and excel
      await ImageAPI.upload(images);
      await ExcelAPI.upload([excelFile]);

      const res = await ImageAPI.rename({
        image_names: images.map((f) => f.name),
        excel_file_name: excelFile.name,
        template,
        match_excel_column: matchCol,
        prefix,
        suffix,
        regex_pattern: regexPattern || null,
        regex_replace: regexReplace || null,
        case_transform: caseTransform,
        output_target: "zip",
      });

      setMessage(`Job Batch Rename telah dijadwalkan (ID: ${res.job.job_id}). Pantau di Job Queue.`);
    } catch (err: any) {
      setMessage(`Gagal memproses rename: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Title Banner */}
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <FileText className="w-6 h-6 text-purple-400" />
          Mass Image Rename (Template & Excel Matching)
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Ubah nama berkas gambar massal otomatis berbasis metadata file Excel & template dinamis.
        </p>
      </div>

      {/* AI Template Assistant */}
      <AIAssistantBox
        title="AI Rename Template Assistant"
        contextHint="Minta AI merumuskan template rename gambar atau regex replacement sesuai kebutuhan dokumen Anda."
        placeholder="misal: 'Buatkan template rename foto peserta dengan format Nama lengkap dan NIK KTP'"
        onApplyResult={(aiText) => {
          if (aiText.includes("{")) {
            const match = aiText.match(/\{[^}]+\}/g);
            if (match) setTemplate(match.join("_"));
          }
        }}
      />

      {message && (
        <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 text-xs text-foreground flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-primary shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Upload Inputs Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-xl border border-border bg-card space-y-4">
          <h2 className="text-sm font-semibold text-foreground">1. Upload Gambar-Gambar Massal</h2>
          <FileUploader
            accept={{ "image/*": [".jpg", ".jpeg", ".png", ".webp", ".bmp", ".heic"] }}
            label="Upload file gambar (JPG, PNG, WEBP, HEIC)"
            multiple={true}
            onFilesSelected={(files) => setImages(files)}
          />
        </div>

        <div className="p-5 rounded-xl border border-border bg-card space-y-4">
          <h2 className="text-sm font-semibold text-foreground">2. Upload Metadata Excel</h2>
          <FileUploader
            accept={{ "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"], "text/csv": [".csv"] }}
            label="Upload file Excel acuan metadata"
            multiple={false}
            onFilesSelected={(files) => setExcelFile(files[0] || null)}
          />
        </div>
      </div>

      {/* Configuration Controls */}
      <div className="p-6 rounded-xl border border-border bg-card space-y-5">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          3. Pengaturan Template Nama & Aturan Transformasi
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Template Nama Dinamis:</label>
            <input
              type="text"
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-md border border-border bg-background font-mono"
            />
            <span className="text-[10px] text-muted-foreground mt-1 block">
              Gunakan: <code className="text-primary">{`{Nama}`}</code>, <code className="text-primary">{`{NIK}`}</code>, <code className="text-primary">{`{Tanggal}`}</code>, <code className="text-primary">{`{RunningNumber}`}</code>
            </span>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Kolom Acuan Excel:</label>
            <input
              type="text"
              value={matchCol}
              onChange={(e) => setMatchCol(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-md border border-border bg-background"
              placeholder="misal: NIK atau Nama"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Ubah Kapitalisasi (Casing):</label>
            <select
              value={caseTransform}
              onChange={(e: any) => setCaseTransform(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-md border border-border bg-background"
            >
              <option value="uppercase">HURUF BESAR (UPPERCASE)</option>
              <option value="lowercase">huruf kecil (lowercase)</option>
              <option value="titlecase">Huruf Depan Kapital (Title Case)</option>
              <option value="none">Asli (Tidak Diubah)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Awalan (Prefix):</label>
            <input
              type="text"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-md border border-border bg-background"
              placeholder="misal: KTP_"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Akhiran (Suffix):</label>
            <input
              type="text"
              value={suffix}
              onChange={(e) => setSuffix(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-md border border-border bg-background"
              placeholder="misal: _FINAL"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Regex Filter (Opsional):</label>
            <input
              type="text"
              value={regexPattern}
              onChange={(e) => setRegexPattern(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-md border border-border bg-background font-mono"
              placeholder="Pattern e.g. [^a-zA-Z0-9]"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={handleGeneratePreview}
            disabled={isProcessing}
            className="flex-1 py-2.5 rounded-md border border-border bg-muted hover:bg-muted/80 text-foreground font-semibold text-xs transition-all flex items-center justify-center gap-2"
          >
            <Eye className="w-4 h-4" />
            <span>Generate Live Preview (Tinjau Nama)</span>
          </button>

          <button
            onClick={handleExecuteRename}
            disabled={isProcessing}
            className="flex-1 py-2.5 rounded-md bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Eksekusi Mass Rename Gambar</span>
          </button>
        </div>
      </div>

      {/* Live Preview Table */}
      {previewData.length > 0 && (
        <div className="p-6 rounded-xl border border-border bg-card space-y-4">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Live Preview Tabel Hasil Rename (Sebelum vs Sesudah)
          </h2>
          <div className="overflow-x-auto border border-border rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted text-muted-foreground uppercase font-medium border-b border-border">
                <tr>
                  <th className="p-3">Nama Berkas Asli</th>
                  <th className="p-3">Hasil Usulan Nama Baru</th>
                  <th className="p-3">Data Excel Terkait</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {previewData.map((item, idx) => (
                  <tr key={idx} className="hover:bg-muted/30">
                    <td className="p-3 text-muted-foreground font-mono">{item.original_filename}</td>
                    <td className="p-3 font-semibold text-emerald-500 font-mono">{item.proposed_filename}</td>
                    <td className="p-3 text-muted-foreground">
                      {JSON.stringify(item.matched_data)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
