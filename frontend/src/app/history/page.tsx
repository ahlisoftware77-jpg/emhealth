"use client";

import { useAppStore } from "@/store/useAppStore";
import { History as HistoryIcon, Download, CheckCircle2 } from "lucide-react";

export default function HistoryPage() {
  const { jobs } = useAppStore();
  const completedJobs = jobs.filter((j) => j.status === "Completed");

  return (
    <div className="space-y-6 pb-12">
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <HistoryIcon className="w-6 h-6 text-emerald-500" />
          Riwayat Eksekusi Berkas (Execution History)
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Log lengkap tugas pemrosesan Excel dan Gambar yang telah selesai dieksekusi.
        </p>
      </div>

      <div className="p-6 rounded-xl border border-border bg-card space-y-4">
        {completedJobs.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted-foreground border border-dashed border-border rounded-lg">
            Belum ada riwayat tugas yang selesai.
          </div>
        ) : (
          <div className="space-y-2">
            {completedJobs.map((j) => (
              <div key={j.job_id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-lg border border-border bg-muted/20 text-xs gap-3">
                <div>
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>{j.task_type}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">({j.job_id})</span>
                  </div>
                  <p className="text-muted-foreground mt-0.5">{j.message}</p>
                </div>
                {j.result_url && (
                  <a
                    href={`http://localhost:8003${j.result_url}`}
                    download
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 self-start sm:self-auto"
                  >
                    <Download className="w-3.5 h-3.5" /> Unduh Berkas
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
