"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { SettingsAPI } from "@/lib/api";
import { Settings as SettingsIcon, Save, Cloud, HardDrive, ShieldCheck, AlertCircle, Bot, Sparkles, Send, Loader2, Database, CheckCircle2 } from "lucide-react";

export default function SettingsPage() {
  const { data, refetch } = useQuery({
    queryKey: ["appSettings"],
    queryFn: SettingsAPI.get,
  });

  const [storageEngine, setStorageEngine] = useState<string>("cloudinary");
  const [tesseractCmd, setTesseractCmd] = useState<string>("");
  const [cloudName, setCloudName] = useState<string>("");
  const [uploadPreset, setUploadPreset] = useState<string>("");

  // Firebase / Firestore
  const [firebaseProjectId, setFirebaseProjectId] = useState<string>("");
  const [firebaseApiKey, setFirebaseApiKey] = useState<string>("");
  const [firebaseServiceAccountJson, setFirebaseServiceAccountJson] = useState<string>("");

  // AI API Keys
  const [openaiKey, setOpenaiKey] = useState<string>("");
  const [geminiKey, setGeminiKey] = useState<string>("");
  const [deepseekKey, setDeepseekKey] = useState<string>("");
  const [primaryAi, setPrimaryAi] = useState<string>("openai");

  // AI Test Assistant
  const [aiPrompt, setAiPrompt] = useState<string>("");
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (data?.settings) {
      setStorageEngine(data.settings.primary_storage_engine || "cloudinary");
      setTesseractCmd(data.settings.tesseract_cmd || "");
      setCloudName(data.settings.cloudinary_cloud_name || "");
      setUploadPreset(data.settings.cloudinary_upload_preset || "");
      setFirebaseProjectId(data.settings.firebase_project_id || "");
      setFirebaseApiKey(data.settings.firebase_api_key || "");
      setFirebaseServiceAccountJson(data.settings.firebase_service_account_json || "");
      setOpenaiKey(data.settings.openai_api_key || "");
      setGeminiKey(data.settings.gemini_api_key || "");
      setDeepseekKey(data.settings.deepseek_api_key || "");
      setPrimaryAi(data.settings.primary_ai_provider || "openai");
    }
  }, [data]);

  const [statusType, setStatusType] = useState<"success" | "error" | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    setStatusType(null);
    try {
      // 1. Langsung push ke Firestore dari Frontend
      try {
        const { doc, setDoc } = await import("firebase/firestore");
        const { db } = await import("@/lib/firebase");
        
        await setDoc(doc(db, "settings", "system_config"), {
          PRIMARY_STORAGE_ENGINE: storageEngine,
          TESSERACT_CMD: tesseractCmd,
          CLOUDINARY_CLOUD_NAME: cloudName,
          CLOUDINARY_UPLOAD_PRESET: uploadPreset,
          FIREBASE_PROJECT_ID: firebaseProjectId,
          FIREBASE_API_KEY: firebaseApiKey,
          FIREBASE_SERVICE_ACCOUNT_JSON: firebaseServiceAccountJson,
          OPENAI_API_KEY: openaiKey,
          GEMINI_API_KEY: geminiKey,
          DEEPSEEK_API_KEY: deepseekKey,
          PRIMARY_AI_PROVIDER: primaryAi,
        }, { merge: true });
        console.log("Berhasil push langsung ke Firestore dari client!");
      } catch (fbErr) {
        console.warn("Gagal push ke Firestore dari client:", fbErr);
      }

      // 2. Teruskan ke Backend (supaya backend juga memperbarui environment-nya sendiri)
      const res = await SettingsAPI.update({
        primary_storage_engine: storageEngine,
        tesseract_cmd: tesseractCmd,
        cloudinary_cloud_name: cloudName,
        cloudinary_upload_preset: uploadPreset,
        firebase_project_id: firebaseProjectId,
        firebase_api_key: firebaseApiKey,
        firebase_service_account_json: firebaseServiceAccountJson,
        openai_api_key: openaiKey,
        gemini_api_key: geminiKey,
        deepseek_api_key: deepseekKey,
        primary_ai_provider: primaryAi,
      });
      setStatusType("success");
      setMessage(
        res?.message || 
        "✅ Pengaturan & Konfigurasi telah BERHASIL DISIMPAN secara permanen ke File .env Server dan database Firestore Cloud!"
      );
      refetch();
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.message || "Gagal menyimpan pengaturan ke server.";
      setStatusType("error");
      setMessage(`Gagal menyimpan pengaturan: ${detail}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestAi = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiResponse(null);
    setAiError(null);
    try {
      const res = await (await import("@/lib/api")).AIAPI.chat(aiPrompt, primaryAi);
      setAiResponse(res.response);
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.message || "Gagal menghubungi AI Provider.";
      setAiError(detail);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Title */}
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-indigo-400" />
          Pengaturan & Konfigurasi Sistem
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Atur pilihan engine penyimpanan (Cloudinary vs Local Storage), jalur Tesseract OCR, dan kredensial API.
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl border text-xs font-semibold flex items-start gap-3 shadow-md transition-all ${
            statusType === "success"
              ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400 dark:text-emerald-300"
              : "bg-red-500/15 border-red-500/40 text-red-400 dark:text-red-300"
          }`}
        >
          {statusType === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          )}
          <div className="space-y-0.5">
            <span className="font-bold block text-sm">
              {statusType === "success" ? "Berhasil Disimpan!" : "Gagal Menyimpan!"}
            </span>
            <p className="font-normal opacity-90">{message}</p>
          </div>
        </div>
      )}

      <div className="max-w-3xl space-y-6">
        {/* Storage Engine Toggle Card */}
        <div className="p-6 rounded-xl border border-border bg-card space-y-4">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Cloud className="w-4 h-4 text-cyan-400" />
            Pilihan Primary Image Storage Engine
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              onClick={() => setStorageEngine("cloudinary")}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                storageEngine === "cloudinary"
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:bg-muted/40"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm text-foreground flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-cyan-400" /> Cloudinary (Cloud)
                </span>
                {storageEngine === "cloudinary" && <ShieldCheck className="w-4 h-4 text-emerald-500" />}
              </div>
              <p className="text-xs text-muted-foreground">
                Penyimpanan cloud utama untuk manajemen dan kompresi berkas gambar.
              </p>
            </div>

            <div
              onClick={() => setStorageEngine("local")}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                storageEngine === "local"
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:bg-muted/40"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm text-foreground flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-rose-400" /> Local Storage (Server)
                </span>
                {storageEngine === "local" && <ShieldCheck className="w-4 h-4 text-emerald-500" />}
              </div>
              <p className="text-xs text-muted-foreground">
                Simpan langsung ke folder upload, output, temp, dan cache lokal server.
              </p>
            </div>
          </div>
        </div>

        {/* Tesseract OCR Path Card */}
        <div className="p-6 rounded-xl border border-border bg-card space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Jalur Binary Executable Tesseract OCR</h2>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Executable Path:</label>
            <input
              type="text"
              value={tesseractCmd}
              onChange={(e) => setTesseractCmd(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-md border border-border bg-background font-mono"
              placeholder="e.g. C:\Program Files\Tesseract-OCR\tesseract.exe atau /usr/bin/tesseract"
            />
          </div>
        </div>

        {/* AI Provider 1: OpenAI Card */}
        <div className="p-6 rounded-xl border border-border bg-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                OA
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  OpenAI Configuration (GPT-4o / GPT-4o-mini)
                </h2>
                <p className="text-[11px] text-muted-foreground">Model kecerdasan buatan utama untuk analisa dan pembuatan teks.</p>
              </div>
            </div>
            {primaryAi === "openai" && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase">
                Primary Active
              </span>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">OpenAI API Key (sk-proj-...):</label>
              <input
                type="password"
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background font-mono text-foreground"
                placeholder="sk-proj-xxxxxxxxxxxxxxxxxxxxxxxx"
              />
            </div>
            <button
              type="button"
              onClick={() => setPrimaryAi("openai")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                primaryAi === "openai"
                  ? "bg-emerald-600 text-white"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground"
              }`}
            >
              {primaryAi === "openai" ? "✓ Dipilih Sebagai Provider Utama" : "Jadikan Provider Utama"}
            </button>
          </div>
        </div>

        {/* AI Provider 2: Google Gemini Card */}
        <div className="p-6 rounded-xl border border-border bg-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                GG
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  Google Gemini Configuration (Gemini 1.5 Flash / Pro)
                </h2>
                <p className="text-[11px] text-muted-foreground">Model kecerdasan buatan multimodal kecepatan tinggi dari Google.</p>
              </div>
            </div>
            {primaryAi === "gemini" && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold uppercase">
                Primary Active
              </span>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">Google Gemini API Key (AIzaSy...):</label>
              <input
                type="password"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background font-mono text-foreground"
                placeholder="AIzaSyXXXXXXXXXXXXXXXXXXXXXXXX"
              />
            </div>
            <button
              type="button"
              onClick={() => setPrimaryAi("gemini")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                primaryAi === "gemini"
                  ? "bg-blue-600 text-white"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground"
              }`}
            >
              {primaryAi === "gemini" ? "✓ Dipilih Sebagai Provider Utama" : "Jadikan Provider Utama"}
            </button>
          </div>
        </div>

        {/* AI Provider 3: DeepSeek AI Card */}
        <div className="p-6 rounded-xl border border-border bg-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">
                DS
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  DeepSeek AI Configuration (DeepSeek-V3 / R1)
                </h2>
                <p className="text-[11px] text-muted-foreground">Model AI performa tinggi hemat biaya untuk tugas analisis logika kompleks.</p>
              </div>
            </div>
            {primaryAi === "deepseek" && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold uppercase">
                Primary Active
              </span>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">DeepSeek API Key (sk-...):</label>
              <input
                type="password"
                value={deepseekKey}
                onChange={(e) => setDeepseekKey(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background font-mono text-foreground"
                placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
              />
            </div>
            <button
              type="button"
              onClick={() => setPrimaryAi("deepseek")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                primaryAi === "deepseek"
                  ? "bg-cyan-600 text-white"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground"
              }`}
            >
              {primaryAi === "deepseek" ? "✓ Dipilih Sebagai Provider Utama" : "Jadikan Provider Utama"}
            </button>
          </div>
        </div>

        {/* Global AI Test Playground Card */}
        <div className="p-6 rounded-xl border border-purple-500/30 bg-purple-500/5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Uji Koneksi AI Playground ({primaryAi.toUpperCase()})
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
              Active Provider: {primaryAi}
            </span>
          </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Masukkan prompt uji, misal: 'Buatkan deskripsi singkat untuk data excel produk ini'"
                className="flex-1 px-3 py-2 text-xs rounded-md border border-border bg-background"
                onKeyDown={(e) => e.key === "Enter" && handleTestAi()}
              />
              <button
                type="button"
                onClick={handleTestAi}
                disabled={aiLoading || !aiPrompt.trim()}
                className="px-4 py-2 rounded-md bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition-all disabled:opacity-50 flex items-center gap-1.5 shrink-0"
              >
                {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Kirim</span>
              </button>
            </div>

            {aiError && (
              <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-xs">
                {aiError}
              </div>
            )}

            {aiResponse && (
              <div className="p-3.5 rounded-lg border border-purple-500/30 bg-purple-500/10 text-xs text-foreground space-y-1">
                <span className="font-semibold text-purple-400 block text-[11px]">Respon AI Provider:</span>
                <p className="whitespace-pre-wrap leading-relaxed">{aiResponse}</p>
              </div>
            )}
          </div>

        {/* Firebase & Firestore Cloud Database Card */}
        <div className="p-6 rounded-xl border border-border bg-card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Database className="w-4 h-4 text-orange-400" />
              Firebase & Firestore Cloud Database
            </h2>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full border font-medium flex items-center gap-1 ${
                data?.settings?.firestore_connected
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/20"
              }`}
            >
              <Database className="w-3 h-3" />
              {data?.settings?.firestore_connected ? "Firestore Active & Connected" : "Local Memory Fallback Active"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Firestore menyimpan riwayat Job Queue dan Preset Pengolahan Data secara otomatis dan permanen di Google Cloud.
          </p>

          <div className="space-y-3 pt-2">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Copas Raw Service Account JSON / SDK Snippet Firestore:
              </label>
              <textarea
                rows={5}
                value={firebaseServiceAccountJson}
                onChange={(e) => setFirebaseServiceAccountJson(e.target.value)}
                className="w-full p-3 text-xs rounded-md border border-border bg-background font-mono leading-relaxed"
                placeholder="Copas langsung isi file Service Account JSON di sini..."
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                *Cukup paste JSON Service Account di atas, sistem akan mengurai project_id dan private_key secara otomatis.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Firebase Project ID:</label>
                <input
                  type="text"
                  value={firebaseProjectId}
                  onChange={(e) => setFirebaseProjectId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-md border border-border bg-background font-mono"
                  placeholder="misal: emhealth-production-123"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Firebase Web API Key:</label>
                <input
                  type="password"
                  value={firebaseApiKey}
                  onChange={(e) => setFirebaseApiKey(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-md border border-border bg-background font-mono"
                  placeholder="AIzaSy..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* User Approval Management Card (Super Admin / Admin Only) */}
        <UserManagementSection />

        {/* Cloudinary Credentials Card */}
        <div className="p-6 rounded-xl border border-border bg-card space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Kredensial API Cloudinary</h2>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Cloud Name:</label>
              <input
                type="text"
                value={cloudName}
                onChange={(e) => setCloudName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-md border border-border bg-background"
                placeholder="Cloud Name Cloudinary Anda"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Unsigned Upload Preset:</label>
              <input
                type="text"
                value={uploadPreset}
                onChange={(e) => setUploadPreset(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-md border border-border bg-background"
                placeholder="Nama Preset Anda (misal: preset_saya_123)"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full py-3 rounded-md bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 transition-all flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? "Menyimpan..." : "Simpan Pengaturan"}</span>
        </button>
      </div>
    </div>
  );
}

function UserManagementSection() {
  const { data: usersData, refetch: refetchUsers, isLoading } = useQuery({
    queryKey: ["allUsersList"],
    queryFn: SettingsAPI ? async () => {
      const res = await (await import("@/lib/api")).AuthAPI.listUsers();
      return res;
    } : async () => ({ users: [] }),
  });

  const [processingUid, setProcessingUid] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const handleApproveReject = async (uid: string, action: "approve" | "reject", role?: string) => {
    setProcessingUid(uid);
    setActionMsg(null);
    try {
      const res = await (await import("@/lib/api")).AuthAPI.approveUser(uid, action, role);
      setActionMsg(res.message);
      refetchUsers();
    } catch (err: any) {
      alert("Gagal memproses pendaftaran user: " + (err.response?.data?.detail || err.message));
    } finally {
      setProcessingUid(null);
    }
  };

  const users = usersData?.users || [];
  const pendingUsers = users.filter((u: any) => u.status === "Pending");
  const approvedUsers = users.filter((u: any) => u.status !== "Pending");

  return (
    <div className="p-6 rounded-xl border border-border bg-card space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-purple-400" />
          Konfirmasi Pendaftaran & Manajemen User
        </h2>
        {pendingUsers.length > 0 && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 animate-pulse">
            {pendingUsers.length} Antrean Pendaftaran
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Setujui (Approve) pendaftaran akun baru sebelum pengguna tersebut dapat masuk ke dalam sistem.
      </p>

      {actionMsg && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
          {actionMsg}
        </div>
      )}

      {/* Pending Approval Section */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Pendaftaran Menunggu Konfirmasi ({pendingUsers.length})</h3>
        {isLoading ? (
          <div className="py-4 text-center text-xs text-muted-foreground">Memuat antrean...</div>
        ) : pendingUsers.length === 0 ? (
          <div className="p-3 rounded-lg border border-dashed border-border text-xs text-muted-foreground text-center">
            Tidak ada pendaftaran baru yang menunggu konfirmasi.
          </div>
        ) : (
          <div className="space-y-2">
            {pendingUsers.map((u: any) => (
              <div key={u.uid} className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 flex items-center justify-between gap-4">
                <div className="space-y-0.5 min-w-0">
                  <div className="font-semibold text-xs text-foreground truncate">{u.name}</div>
                  <div className="text-[11px] text-muted-foreground font-mono truncate">{u.email}</div>
                  <div className="text-[10px] text-amber-400 font-mono">Status: Menunggu Persetujuan</div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={processingUid === u.uid}
                    onClick={() => handleApproveReject(u.uid, "approve", "User")}
                    className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all flex items-center gap-1 shadow-sm"
                  >
                    Setujui (Approve)
                  </button>
                  <button
                    type="button"
                    disabled={processingUid === u.uid}
                    onClick={() => handleApproveReject(u.uid, "reject")}
                    className="px-3 py-1.5 rounded-md bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 font-semibold text-xs transition-all border border-rose-500/30"
                  >
                    Tolak
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approved / Existing Users Section */}
      <div className="space-y-2 pt-3 border-t border-border">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Daftar Pengguna Terverifikasi ({approvedUsers.length})</h3>
        {approvedUsers.length > 0 && (
          <div className="divide-y divide-border/60 max-h-48 overflow-y-auto pr-1">
            {approvedUsers.map((u: any) => (
              <div key={u.uid} className="py-2 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-foreground">{u.name}</span>
                  <span className="text-[11px] text-muted-foreground font-mono ml-2">({u.email})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                    u.role === "Super Admin" ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" : "bg-muted text-muted-foreground"
                  }`}>
                    {u.role || "User"}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                    u.status === "Approved" ? "text-emerald-400" : "text-rose-400"
                  }`}>
                    {u.status || "Approved"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
