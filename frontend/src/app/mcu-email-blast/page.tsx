"use client";

import { useState, useEffect } from "react";
import { MCUBlastAPI, ExcelAPI } from "@/lib/api";
import { FileUploader } from "@/components/ui/FileUploader";
import { 
  Mail, 
  Send, 
  CheckCircle2, 
  XCircle, 
  Server, 
  FileSpreadsheet, 
  ImageIcon, 
  Sparkles, 
  Lock, 
  User, 
  Building2, 
  Link as LinkIcon, 
  RefreshCw, 
  Play, 
  Check, 
  AlertTriangle,
  RotateCw,
  ShieldCheck
} from "lucide-react";

export default function MCUEmailBlastPage() {
  // State 1: Uploads
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [excelPreview, setExcelPreview] = useState<any>(null);
  const [loadingPreview, setLoadingPreview] = useState<boolean>(false);

  useEffect(() => {
    if (!excelFile) {
      setExcelPreview(null);
      return;
    }
    const fetchPreview = async () => {
      setLoadingPreview(true);
      try {
        const res = await ExcelAPI.inspectFile(excelFile);
        if (res?.data) {
          setExcelPreview(res.data);
        }
      } catch (err: any) {
        console.error("Gagal load preview Excel:", err);
      } finally {
        setLoadingPreview(false);
      }
    };
    fetchPreview();
  }, [excelFile]);


  // State 2: Sender Config
  const [mode, setMode] = useState<"GMAIL" | "CUSTOM_DOMAIN">("GMAIL");
  const [senderEmail, setSenderEmail] = useState<string>("emhealth.medicalcenter2@gmail.com");
  const [senderPassword, setSenderPassword] = useState<string>("fkfu xkvx dlcg gwpp");
  const [customSmtpServer, setCustomSmtpServer] = useState<string>("mail.klinikutamaemhealth.com");
  const [customSmtpPort, setCustomSmtpPort] = useState<number>(465);
  const [customUseSsl, setCustomUseSsl] = useState<boolean>(true);
  const [senderName, setSenderName] = useState<string>("EM-Health Admin");
  const [programName, setProgramName] = useState<string>("Medical Check Up");
  const [companyName, setCompanyName] = useState<string>("PT. YADIKOMPUTER");
  const [linkUrl, setLinkUrl] = useState<string>("https://mcu-emhealth.com/login-employee");
  const [delaySeconds, setDelaySeconds] = useState<number>(5);
  const [dryRun, setDryRun] = useState<boolean>(true);

  // State 3: Execution & Loading
  const [verifyingSmtp, setVerifyingSmtp] = useState<boolean>(false);
  const [smtpStatus, setSmtpStatus] = useState<{ success: boolean; message: string } | null>(null);

  const [processingImages, setProcessingImages] = useState<boolean>(false);
  const [processedData, setProcessedData] = useState<{
    total_recipients: number;
    total_processed: number;
    recipients: any[];
    results: any[];
  } | null>(null);

  const [sendingEmails, setSendingEmails] = useState<boolean>(false);
  const [sendResults, setSendResults] = useState<{
    success: boolean;
    mode: string;
    total: number;
    results: any[];
  } | null>(null);

  const [activeTab, setActiveTab] = useState<"upload" | "config" | "preview" | "blast">("upload");

  // Handler 1: Mode preset switch
  const handleModeChange = (newMode: "GMAIL" | "CUSTOM_DOMAIN") => {
    setMode(newMode);
    setSmtpStatus(null);
    if (newMode === "GMAIL") {
      setSenderEmail("emhealth.medicalcenter2@gmail.com");
      setSenderPassword("fkfu xkvx dlcg gwpp");
    } else {
      setSenderEmail("info@klinikutamaemhealth.com");
      setSenderPassword("123klinikem123");
    }
  };

  // Handler 2: Verify SMTP
  const handleVerifySMTP = async () => {
    setVerifyingSmtp(true);
    setSmtpStatus(null);
    try {
      const res = await MCUBlastAPI.verifySMTP({
        mode,
        sender_email: senderEmail,
        sender_password: senderPassword,
        smtp_server: customSmtpServer,
        smtp_port: customSmtpPort,
        use_ssl: customUseSsl,
      });
      setSmtpStatus({ success: true, message: res.message });
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.message || "Gagal verifikasi SMTP";
      setSmtpStatus({ success: false, message: detail });
    } finally {
      setVerifyingSmtp(false);
    }
  };

  // Handler 3: Process Images & Match Excel
  const handleProcessImages = async () => {
    if (imageFiles.length === 0) {
      alert("Silakan unggah minimal 1 file gambar!");
      return;
    }
    setProcessingImages(true);
    try {
      const res = await MCUBlastAPI.processImages(imageFiles, excelFile || undefined);
      setProcessedData({
        total_recipients: res.total_recipients_in_excel,
        total_processed: res.total_images_processed,
        recipients: res.recipients,
        results: res.results,
      });
      setActiveTab("preview");
    } catch (err: any) {
      alert(`Gagal memproses gambar & matching: ${err.response?.data?.detail || err.message}`);
    } finally {
      setProcessingImages(false);
    }
  };

  // Handler 4: Send Emails
  const handleSendEmails = async () => {
    if (!confirm(dryRun ? "Mulai SIMULASI pengiriman (Dry Run)?" : "PERHATIAN: Kirim EMAIL NYATA ke penerima sekarang?")) {
      return;
    }
    setSendingEmails(true);
    try {
      const res = await MCUBlastAPI.sendEmails({
        mode,
        sender_email: senderEmail,
        sender_password: senderPassword,
        smtp_server: customSmtpServer,
        smtp_port: customSmtpPort,
        use_ssl: customUseSsl,
        sender_name: senderName,
        program_name: programName,
        company_name: companyName,
        link_url: linkUrl,
        delay_seconds: delaySeconds,
        dry_run: dryRun,
        recipients: processedData?.recipients || null,
      });
      setSendResults(res);
      setActiveTab("blast");
    } catch (err: any) {
      alert(`Gagal mengirim email: ${err.response?.data?.detail || err.message}`);
    } finally {
      setSendingEmails(false);
    }
  };

  const isLocalImagePath = (val: string) => {
    if (!val) return false;
    const lower = val.toLowerCase();
    return (
      (lower.includes(":\\") || lower.includes(":/") || lower.startsWith("/")) &&
      (lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".png") || lower.endsWith(".webp") || lower.endsWith(".gif"))
    );
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header Banner */}
      <div className="border-b border-border pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Mail className="w-6 h-6 text-emerald-400" />
            MCU Email Blast & Image Optimizer
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Kompresi otomatis foto &lt;500KB (Portrait), Auto-Rename NIK/UserID via Excel, dan Pengiriman Email Blast Massal.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 bg-muted p-1 rounded-lg border border-border">
          <button
            onClick={() => setActiveTab("upload")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === "upload" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            1. Upload & Photo
          </button>
          <button
            onClick={() => setActiveTab("config")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === "config" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            2. SMTP & Config
          </button>
          <button
            onClick={() => setActiveTab("preview")}
            disabled={!processedData}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === "preview" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground opacity-50"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            3. Preview Match ({processedData?.results.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("blast")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === "blast" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            4. Real-time Blast
          </button>
        </div>
      </div>

      {/* TAB 1: UPLOAD FILES */}
      {activeTab === "upload" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card Excel Upload */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                File Data Excel Penerima (Opsional)
              </h2>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-mono">
                idpass-update2.xlsx
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Unggah file Excel baru atau biarkan kosong untuk menggunakan data default di <code>D:\COMPRESS\idpass-update2.xlsx</code>.
            </p>
            <FileUploader
              accept={{ "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"] }}
              multiple={false}
              onFilesSelected={(files) => setExcelFile(files[0] || null)}
            />
            {excelFile && (
              <div className="p-3 bg-muted/60 rounded-lg text-xs flex items-center justify-between border border-border">
                <span className="font-mono text-emerald-400 font-medium truncate">{excelFile.name}</span>
                <span className="text-[10px] text-muted-foreground">({(excelFile.size / 1024).toFixed(1)} KB)</span>
              </div>
            )}
          </div>

          {/* Card Images Upload */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-sky-400" />
                Upload Foto Pasien / Peserta (HEIC, JPG, PNG)
              </h2>
              <span className="text-[10px] bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded font-mono">
                Auto Portrait &lt;500KB
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Foto akan otomatis diputar ke posisi portrait, dikompresi di bawah 500KB, dan di-rename berdasarkan NIK/Email Excel.
            </p>
            <FileUploader
              accept={{ "image/*": [".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"] }}
              multiple={true}
              onFilesSelected={(files) => setImageFiles(files)}
            />
            {imageFiles.length > 0 && (
              <div className="p-3 bg-muted/60 rounded-lg text-xs flex items-center justify-between border border-border">
                <span className="font-medium text-foreground">{imageFiles.length} File Gambar Terpilih</span>
                <button
                  onClick={handleProcessImages}
                  disabled={processingImages}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 shadow"
                >
                  {processingImages ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  Proses Kompresi & Match
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Excel Data Preview Section */}
        {(excelPreview || loadingPreview) && (
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4 animate-in fade-in slide-in-from-bottom-2">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              Preview Data Excel
              {excelPreview && (
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-mono">
                  {excelPreview.total_rows} Baris
                </span>
              )}
            </h2>
            
            {loadingPreview ? (
              <div className="p-8 text-center text-xs text-muted-foreground flex flex-col items-center gap-3 bg-muted/20 rounded-lg border border-border">
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
                <span>Membaca data Excel...</span>
              </div>
            ) : excelPreview && excelPreview.columns.length > 0 ? (
              <div className="overflow-x-auto overflow-y-auto max-h-[350px] border border-border rounded-md">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-muted/70 sticky top-0 border-b border-border text-muted-foreground font-semibold shadow-sm">
                    <tr>
                      <th className="p-2 border-r border-border text-center w-10">#</th>
                      {excelPreview.columns.map((col: string, idx: number) => (
                        <th key={idx} className="p-2 border-r border-border min-w-[120px] max-w-[200px] truncate">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border font-mono text-[11px]">
                    {excelPreview.preview_data.map((row: any, rIdx: number) => (
                      <tr key={rIdx} className="hover:bg-muted/30 transition-all">
                        <td className="p-1.5 border-r border-border text-muted-foreground text-center">{rIdx + 1}</td>
                        {excelPreview.columns.map((col: string, cIdx: number) => {
                          const cellValue = String(row[col] ?? "");
                          const isImg = isLocalImagePath(cellValue);
                          return (
                            <td key={cIdx} className="p-1.5 border-r border-border max-w-[200px] text-foreground">
                              {isImg ? (
                                <div className="flex flex-col gap-1 items-start">
                                  <span className="truncate w-full text-[10px] text-muted-foreground" title={cellValue}>{cellValue}</span>
                                  <img 
                                    src={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8003"}/api/v1/local-file/preview?path=${encodeURIComponent(cellValue)}`} 
                                    alt="Preview" 
                                    className="h-12 w-auto rounded object-cover border border-slate-700 shadow-sm"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                </div>
                              ) : (
                                <span className="truncate block" title={cellValue}>{cellValue}</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-muted-foreground bg-muted/20 rounded-lg border border-border">
                Tidak ada data yang bisa ditampilkan.
              </div>
            )}
          </div>
        )}
        </div>
      )}

      {/* TAB 2: SMTP & CONFIG */}
      {activeTab === "config" && (
        <div className="bg-card border border-border rounded-xl p-6 space-y-6 shadow-sm max-w-4xl mx-auto">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Server className="w-5 h-5 text-emerald-400" />
                Pengaturan Pengirim Email & Server SMTP
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Konfigurasi kredensial pengirim Gmail atau Custom Domain dan pesan email.
              </p>
            </div>
            {/* Mode Switcher */}
            <div className="flex items-center gap-1 bg-muted p-1 rounded-lg border border-border">
              <button
                onClick={() => handleModeChange("GMAIL")}
                className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                  mode === "GMAIL" ? "bg-emerald-500 text-white shadow" : "text-muted-foreground"
                }`}
              >
                Mode Gmail
              </button>
              <button
                onClick={() => handleModeChange("CUSTOM_DOMAIN")}
                className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                  mode === "CUSTOM_DOMAIN" ? "bg-emerald-500 text-white shadow" : "text-muted-foreground"
                }`}
              >
                Custom Domain (info@)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-foreground block mb-1">Email Pengirim</label>
              <div className="flex items-center gap-2 bg-muted border border-border rounded-md px-3 py-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  className="bg-transparent border-none outline-none text-foreground w-full font-mono text-xs"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-foreground block mb-1">Password / App Password</label>
              <div className="flex items-center gap-2 bg-muted border border-border rounded-md px-3 py-2">
                <Lock className="w-4 h-4 text-muted-foreground" />
                <input
                  type="password"
                  value={senderPassword}
                  onChange={(e) => setSenderPassword(e.target.value)}
                  className="bg-transparent border-none outline-none text-foreground w-full font-mono text-xs"
                />
              </div>
            </div>

            {mode === "CUSTOM_DOMAIN" && (
              <>
                <div>
                  <label className="font-semibold text-foreground block mb-1">Server SMTP Host</label>
                  <input
                    type="text"
                    value={customSmtpServer}
                    onChange={(e) => setCustomSmtpServer(e.target.value)}
                    className="w-full bg-muted border border-border rounded-md px-3 py-2 text-foreground font-mono text-xs outline-none"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-1/2">
                    <label className="font-semibold text-foreground block mb-1">Port</label>
                    <input
                      type="number"
                      value={customSmtpPort}
                      onChange={(e) => setCustomSmtpPort(Number(e.target.value))}
                      className="w-full bg-muted border border-border rounded-md px-3 py-2 text-foreground font-mono text-xs outline-none"
                    />
                  </div>
                  <div className="w-1/2 pt-5">
                    <label className="flex items-center gap-2 cursor-pointer font-medium">
                      <input
                        type="checkbox"
                        checked={customUseSsl}
                        onChange={(e) => setCustomUseSsl(e.target.checked)}
                        className="rounded accent-emerald-500"
                      />
                      Gunakan SSL (Port 465)
                    </label>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="font-semibold text-foreground block mb-1">Nama Pengirim (Display Name)</label>
              <div className="flex items-center gap-2 bg-muted border border-border rounded-md px-3 py-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className="bg-transparent border-none outline-none text-foreground w-full text-xs"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-foreground block mb-1">Nama Program MCU</label>
              <div className="flex items-center gap-2 bg-muted border border-border rounded-md px-3 py-2">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={programName}
                  onChange={(e) => setProgramName(e.target.value)}
                  className="bg-transparent border-none outline-none text-foreground w-full text-xs"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-foreground block mb-1">Nama Perusahaan</label>
              <div className="flex items-center gap-2 bg-muted border border-border rounded-md px-3 py-2">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="bg-transparent border-none outline-none text-foreground w-full text-xs"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-foreground block mb-1">Link URL Tombol Unduh Hasil</label>
              <div className="flex items-center gap-2 bg-muted border border-border rounded-md px-3 py-2">
                <LinkIcon className="w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="bg-transparent border-none outline-none text-foreground w-full font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {/* Anti-Spam & Delay Controls */}
          <div className="border-t border-border pt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-foreground block mb-1">Jeda Antar Email (Anti-Spam Delay)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={delaySeconds}
                  min={1}
                  max={60}
                  onChange={(e) => setDelaySeconds(Number(e.target.value))}
                  className="w-24 bg-muted border border-border rounded-md px-3 py-2 text-foreground font-mono text-xs outline-none"
                />
                <span className="text-muted-foreground">detik per pesan</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-5">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-foreground">
                <input
                  type="checkbox"
                  checked={dryRun}
                  onChange={(e) => setDryRun(e.target.checked)}
                  className="rounded accent-emerald-500 w-4 h-4"
                />
                Mode Simulasi (Dry Run)
              </label>
              <span className="text-[10px] text-muted-foreground">
                ({dryRun ? "Hanya tes simulasi tanpa kirim email nyata" : "Mode Pengiriman Nyata / Real Send"})
              </span>
            </div>
          </div>

          {/* Action & Verify Button */}
          <div className="flex items-center justify-between border-t border-border pt-4">
            <button
              onClick={handleVerifySMTP}
              disabled={verifyingSmtp}
              className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground border border-border rounded-md text-xs font-semibold transition-all flex items-center gap-2"
            >
              {verifyingSmtp ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4 text-emerald-400" />}
              Uji Koneksi SMTP
            </button>

            {smtpStatus && (
              <div className={`text-xs px-3 py-1.5 rounded-md flex items-center gap-2 font-medium ${
                smtpStatus.success ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
              }`}>
                {smtpStatus.success ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                {smtpStatus.message}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: PREVIEW MATCH & OPTIMIZED IMAGES */}
      {activeTab === "preview" && processedData && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between shadow-sm">
            <div>
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Hasil Kompresi & Match Foto
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {processedData.total_processed} foto berhasil dikompresi &lt;500KB (Portrait) & di-rename NIK/Email.
              </p>
            </div>
            <button
              onClick={handleSendEmails}
              disabled={sendingEmails}
              className={`px-5 py-2 rounded-lg text-xs font-bold transition-all shadow-md flex items-center gap-2 ${
                dryRun ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-emerald-500 hover:bg-emerald-600 text-white"
              }`}
            >
              {sendingEmails ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {dryRun ? "Mulai SIMULASI Blast (Dry Run)" : "KIRIM EMAIL NYATA (Real Send)"}
            </button>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-muted/70 border-b border-border text-muted-foreground font-semibold">
                    <th className="p-3">File Foto Asli</th>
                    <th className="p-3">File Output (NIK)</th>
                    <th className="p-3">Match Source</th>
                    <th className="p-3">Matched Excel Detail</th>
                    <th className="p-3">Ukuran Asli</th>
                    <th className="p-3">Ukuran Akhir</th>
                    <th className="p-3">Dimensi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-mono text-[11px]">
                  {processedData.results.map((r, idx) => (
                    <tr key={idx} className="hover:bg-muted/30 transition-all">
                      <td className="p-3 text-foreground font-sans font-medium">{r.original_filename}</td>
                      <td className="p-3 font-bold text-emerald-400">{r.final_filename}</td>
                      <td className="p-3">
                        {r.match_source ? (
                          <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-sans text-[10px]">
                            {r.match_source}
                          </span>
                        ) : (
                          <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded font-sans text-[10px]">
                            No Match
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-foreground font-sans">{r.matched_detail || "-"}</td>
                      <td className="p-3 text-muted-foreground">{r.original_size_kb} KB</td>
                      <td className="p-3 font-semibold text-emerald-400">{r.compressed_size_kb} KB</td>
                      <td className="p-3 text-muted-foreground">{r.dimensions} ({r.orientation})</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: REAL-TIME BLAST LOGS */}
      {activeTab === "blast" && sendResults && (
        <div className="space-y-4">
          <div className={`border rounded-xl p-4 flex items-center justify-between shadow-sm ${
            sendResults.mode === "DRY_RUN" ? "bg-amber-500/10 border-amber-500/30 text-amber-400" : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
          }`}>
            <div className="flex items-center gap-3">
              {sendResults.mode === "DRY_RUN" ? <AlertTriangle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
              <div>
                <h2 className="text-sm font-bold">
                  {sendResults.mode === "DRY_RUN" ? "Laporan Simulasi Email Blast (Dry Run)" : "Laporan Pengiriman Email Nyata (Real Send)"}
                </h2>
                <p className="text-xs opacity-80 mt-0.5">
                  Total {sendResults.total} penerima telah diproses secara sukses.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded bg-background border border-border text-xs font-mono font-bold text-foreground">
              Total: {sendResults.total} Penerima
            </span>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-muted/70 border-b border-border text-muted-foreground font-semibold">
                    <th className="p-3">#</th>
                    <th className="p-3">Nama Penerima</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">NIK / UserID</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Lampiran Foto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-mono text-[11px]">
                  {sendResults.results.map((res: any) => (
                    <tr key={res.index} className="hover:bg-muted/30 transition-all">
                      <td className="p-3 text-muted-foreground">{res.index}</td>
                      <td className="p-3 text-foreground font-sans font-medium">{res.nama}</td>
                      <td className="p-3 text-sky-400">{res.email}</td>
                      <td className="p-3 font-semibold text-foreground">{res.userid}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-sans font-bold ${
                          res.status.includes("SUKSES") || res.status.includes("OK")
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}>
                          {res.status}
                        </span>
                      </td>
                      <td className="p-3">
                        {res.has_attachment ? (
                          <span className="text-emerald-400 font-sans text-[10px] flex items-center gap-1 font-semibold">
                            <Check className="w-3 h-3" /> Ada ({res.userid}.jpg)
                          </span>
                        ) : (
                          <span className="text-muted-foreground font-sans text-[10px]">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
