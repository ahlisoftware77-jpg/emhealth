"use client";

import { useAppStore } from "@/store/useAppStore";
import { JobQueueAPI, getDownloadUrl } from "@/lib/api";
import { ListTodo, Activity, RefreshCw, RotateCcw, Download, CheckCircle2, XCircle, Clock } from "lucide-react";

export default function JobQueuePage() {
  const { jobs } = useAppStore();

  const handleRetry = async (jobId: string) => {
    try {
      await JobQueueAPI.retryJob(jobId);
    } catch (err: any) {
      alert(`Gagal retry job: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Title */}
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <ListTodo className="w-6 h-6 text-amber-500" />
          Realtime Job Queue Monitor (SSE Stream)
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Pantau status pemrosesan asynchronous berstatus Waiting, Running, Completed, Failed, dan Retry secara realtime.
        </p>
      </div>

      <div className="p-6 rounded-xl border border-border bg-card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-500 animate-pulse" />
            Daftar Antrean Tugas Aktif & Riwayat ({jobs.length})
          </h2>
        </div>

        {jobs.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted-foreground border border-dashed border-border rounded-lg">
            Belum ada tugas dalam antrean saat ini. Jalankan salah satu fitur aplikasi untuk melihat kemajuan di sini.
          </div>
        ) : (
          <div className="overflow-x-auto border border-border rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted text-muted-foreground uppercase font-medium border-b border-border">
                <tr>
                  <th className="p-3">ID & Jenis Tugas</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Kemajuan (Progress)</th>
                  <th className="p-3">Pesan / Detail</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {jobs.map((job) => (
                  <tr key={job.job_id} className="hover:bg-muted/30">
                    <td className="p-3">
                      <div className="font-semibold text-foreground">{job.task_type}</div>
                      <div className="text-[10px] font-mono text-muted-foreground">{job.job_id}</div>
                    </td>

                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          job.status === "Completed"
                            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                            : job.status === "Failed"
                            ? "bg-red-500/10 text-red-500 border border-red-500/20"
                            : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                        }`}
                      >
                        {job.status === "Completed" && <CheckCircle2 className="w-3 h-3" />}
                        {job.status === "Failed" && <XCircle className="w-3 h-3" />}
                        {(job.status === "Running" || job.status === "Waiting") && <Clock className="w-3 h-3 animate-spin" />}
                        <span>{job.status}</span>
                      </span>
                    </td>

                    <td className="p-3 w-48">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono">
                          <span>{job.progress}%</span>
                        </div>
                        <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-primary h-full transition-all duration-300"
                            style={{ width: `${job.progress}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="p-3 text-muted-foreground">
                      <p className="line-clamp-2">{job.message}</p>
                      {job.error_detail && <p className="text-red-500 text-[10px] mt-0.5">{job.error_detail}</p>}
                    </td>

                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {job.status === "Failed" && (
                          <button
                            onClick={() => handleRetry(job.job_id)}
                            className="p-1.5 rounded bg-muted hover:bg-muted/80 text-foreground text-xs"
                            title="Retry Job"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {job.result_url && (
                          <a
                            href={getDownloadUrl(job.result_url)}
                            download
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded text-xs font-semibold transition-all"
                          >
                            <Download className="w-3 h-3" /> Unduh
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
