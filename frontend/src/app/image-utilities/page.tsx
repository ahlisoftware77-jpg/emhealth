"use client";

import { useState } from "react";
import { FileUploader } from "@/components/ui/FileUploader";
import { ImageAPI } from "@/lib/api";
import { ScanText, QrCode, Barcode, AlertCircle } from "lucide-react";
import { AIAssistantBox } from "@/components/ui/AIAssistantBox";

export default function ImageUtilitiesPage() {
  const [activeSubTab, setActiveSubTab] = useState<"ocr" | "qr" | "barcode">("ocr");

  // OCR state
  const [ocrFiles, setOcrFiles] = useState<File[]>([]);
  const [ocrFormat, setOcrFormat] = useState<"txt" | "csv" | "xlsx">("txt");
  const [ocrLang, setOcrLang] = useState<string>("ind+eng");

  // Code Gen state
  const [codeTextList, setCodeTextList] = useState<string>("12345678\n87654321\n99887766");
  const [darkColor, setDarkColor] = useState<string>("#000000");
  const [lightColor, setLightColor] = useState<string>("#FFFFFF");
  const [barcodeType, setBarcodeType] = useState<string>("code128");

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleRunOCR = async () => {
    if (ocrFiles.length === 0) {
      setMessage("Upload berkas gambar terlebih dahulu untuk OCR.");
      return;
    }
    setIsProcessing(true);
    setMessage(null);
    try {
      await ImageAPI.upload(ocrFiles);
      const res = await ImageAPI.ocr({
        image_names: ocrFiles.map((f) => f.name),
        export_format: ocrFormat,
        lang: ocrLang,
      });

      setMessage(`Job OCR telah dijadwalkan (ID: ${res.job.job_id}). Hasil akan tersedia di Job Queue.`);
    } catch (err: any) {
      setMessage(`Gagal memproses OCR: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateCodes = async (type: "qr" | "barcode") => {
    const list = codeTextList
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (list.length === 0) {
      setMessage("Masukkan setidaknya 1 teks/nomor untuk dibuatkan kode.");
      return;
    }

    setIsProcessing(true);
    setMessage(null);
    try {
      const res = await ImageAPI.codeGen({
        code_type: type,
        content_list: list,
        barcode_format: barcodeType,
        dark_color: darkColor,
        light_color: lightColor,
      });

      setMessage(`Job Pembuatan ${type.toUpperCase()} dijadwalkan (ID: ${res.job.job_id}).`);
    } catch (err: any) {
      setMessage(`Gagal: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Title */}
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <ScanText className="w-6 h-6 text-amber-400" />
          OCR Text Extractor & QR / Barcode Generator
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Ekstraksi teks dari gambar massal via Tesseract OCR serta generator QR Code & Barcode massal.
        </p>
      </div>

      {/* AI Vision & OCR Assistant */}
      <AIAssistantBox
        title="AI Vision & Document Structurer"
        contextHint="Gunakan AI untuk merangkum hasil OCR, ekstraksi data KTP/Struk, atau generate teks QR secara cerdas."
        placeholder="misal: 'Formatkan hasil ekstraksi teks dokumen medis ke dalam tabel JSON'"
      />

      {message && (
        <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 text-xs text-foreground flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-primary shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Subtabs */}
      <div className="flex border-b border-border space-x-2">
        <button
          onClick={() => setActiveSubTab("ocr")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
            activeSubTab === "ocr" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <ScanText className="w-4 h-4" /> OCR (Ekstraksi Teks Gambar)
        </button>
        <button
          onClick={() => setActiveSubTab("qr")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
            activeSubTab === "qr" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <QrCode className="w-4 h-4" /> Generator QR Code Massal
        </button>
        <button
          onClick={() => setActiveSubTab("barcode")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
            activeSubTab === "barcode" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Barcode className="w-4 h-4" /> Generator Barcode Massal
        </button>
      </div>

      {/* SUBTAB 1: OCR */}
      {activeSubTab === "ocr" && (
        <div className="max-w-2xl mx-auto p-6 rounded-xl border border-border bg-card space-y-5">
          <h2 className="text-sm font-semibold text-foreground">Tesseract OCR Image-to-Text Engine</h2>
          <FileUploader
            accept={{ "image/*": [".jpg", ".jpeg", ".png", ".bmp"] }}
            label="Upload dokumen/gambar yang berisi teks"
            multiple={true}
            onFilesSelected={(files) => setOcrFiles(files)}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Bahasa OCR:</label>
              <select
                value={ocrLang}
                onChange={(e) => setOcrLang(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-md border border-border bg-background"
              >
                <option value="ind+eng">Indonesia & Inggris (ind+eng)</option>
                <option value="ind">Bahasa Indonesia saja</option>
                <option value="eng">English only</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Format Output Export:</label>
              <select
                value={ocrFormat}
                onChange={(e: any) => setOcrFormat(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-md border border-border bg-background"
              >
                <option value="txt">Berkas Teks (.txt)</option>
                <option value="csv">Tabel CSV (.csv)</option>
                <option value="xlsx">Excel File (.xlsx)</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleRunOCR}
            disabled={isProcessing}
            className="w-full py-2.5 rounded-md bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 transition-all"
          >
            {isProcessing ? "Menjalankan OCR..." : "Ekstrak Teks Gambar Sekarang"}
          </button>
        </div>
      )}

      {/* SUBTAB 2 & 3: CODE GEN */}
      {(activeSubTab === "qr" || activeSubTab === "barcode") && (
        <div className="max-w-2xl mx-auto p-6 rounded-xl border border-border bg-card space-y-5">
          <h2 className="text-sm font-semibold text-foreground">
            Pembuat {activeSubTab === "qr" ? "QR Code" : "Barcode"} Massal
          </h2>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              Daftar Teks / Nomor (satu data per baris):
            </label>
            <textarea
              rows={6}
              value={codeTextList}
              onChange={(e) => setCodeTextList(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-md border border-border bg-background font-mono"
            />
          </div>

          {activeSubTab === "qr" ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Warna QR (Dark Color):</label>
                <input
                  type="color"
                  value={darkColor}
                  onChange={(e) => setDarkColor(e.target.value)}
                  className="w-full h-9 p-1 rounded-md border border-border bg-background"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Warna Latar (Background):</label>
                <input
                  type="color"
                  value={lightColor}
                  onChange={(e) => setLightColor(e.target.value)}
                  className="w-full h-9 p-1 rounded-md border border-border bg-background"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Format Barcode:</label>
              <select
                value={barcodeType}
                onChange={(e) => setBarcodeType(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-md border border-border bg-background"
              >
                <option value="code128">Code 128 (Alfanumerik Umum)</option>
                <option value="code39">Code 39</option>
                <option value="ean13">EAN-13 (Produk Ritel 13 Digit)</option>
              </select>
            </div>
          )}

          <button
            onClick={() => handleGenerateCodes(activeSubTab)}
            disabled={isProcessing}
            className="w-full py-2.5 rounded-md bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 transition-all"
          >
            {isProcessing ? "Membuat Kode..." : `Generate Paket ZIP ${activeSubTab.toUpperCase()}`}
          </button>
        </div>
      )}
    </div>
  );
}
