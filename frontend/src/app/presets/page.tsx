"use client";

import { useQuery } from "@tanstack/react-query";
import { PresetsAPI } from "@/lib/api";
import { Sliders, Plus, Trash2, Bookmark } from "lucide-react";
import { useState } from "react";
import { AIAssistantBox } from "@/components/ui/AIAssistantBox";

export default function PresetsPage() {
  const { data, refetch } = useQuery({
    queryKey: ["presetsList"],
    queryFn: PresetsAPI.list,
  });

  const [name, setName] = useState("");
  const [category, setCategory] = useState("rename");
  const [templateRule, setTemplateRule] = useState("{Nama}_{NIK}");

  const handleCreate = async () => {
    if (!name) return;
    await PresetsAPI.create({
      name,
      category,
      configuration: { template: "{Nama}_{NIK}", case_transform: "uppercase" },
    });
    setName("");
    refetch();
  };

  const handleDelete = async (id: string) => {
    await PresetsAPI.delete(id);
    refetch();
  };

  const presets = data?.presets || [];

  return (
    <div className="space-y-6 pb-12">
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Sliders className="w-6 h-6 text-indigo-500" />
          Preset Configuration Manager
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Simpan dan kelola preset konfigurasi rutin (misal: "Format Rename KTP Standard", "Standar Kompresi Web 80%").
        </p>
      </div>

      {/* AI Smart Preset Generator Box */}
      <AIAssistantBox
        title="AI Preset Generator & Recommender"
        contextHint="Minta AI merekomendasikan nama preset dan pola konfigurasi otomatis berdasarkan kebutuhan bisnis Anda."
        placeholder="misal: 'Rekomendasikan preset rename gambar untuk sertifikat medis rumah sakit'"
        onApplyResult={(text) => {
          if (!name) setName("AI Suggested Preset");
          // Extract pattern if found
          if (text.includes("{")) {
            const match = text.match(/\{[^}]+\}/g);
            if (match) setTemplateRule(match.join("_"));
          }
        }}
      />

      {/* Create New Preset Box */}
      <div className="p-5 rounded-xl border border-border bg-card space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Buat Preset Baru</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Nama Preset e.g. Kompresi Thumbnail Web"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="px-3 py-2 text-xs rounded-md border border-border bg-background"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2 text-xs rounded-md border border-border bg-background"
          >
            <option value="rename">Batch Image Rename</option>
            <option value="compress">Image Compression</option>
            <option value="compare">Excel Compare</option>
            <option value="ocr">OCR Extract</option>
          </select>
          <button
            onClick={handleCreate}
            className="py-2 px-4 rounded-md bg-primary text-primary-foreground font-semibold text-xs flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Simpan Preset
          </button>
        </div>
      </div>

      {/* Preset List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {presets.map((p: any) => (
          <div key={p.id} className="p-5 rounded-xl border border-border bg-card space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-primary/10 text-primary">
                  {p.category}
                </span>
                <button onClick={() => handleDelete(p.id)} className="text-muted-foreground hover:text-red-500">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <h3 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                <Bookmark className="w-4 h-4 text-indigo-400" /> {p.name}
              </h3>
              <pre className="p-2 rounded bg-muted text-[10px] font-mono text-muted-foreground overflow-x-auto">
                {JSON.stringify(p.configuration, null, 2)}
              </pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
