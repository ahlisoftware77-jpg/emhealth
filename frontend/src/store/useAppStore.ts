import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: "Super Admin" | "Admin" | "User";
}

export interface JobItem {
  job_id: string;
  task_type: string;
  status: "Waiting" | "Running" | "Completed" | "Failed" | "Retry";
  progress: number;
  message: string;
  result_url?: string;
  download_filename?: string;
  created_at: number;
  updated_at: number;
  error_detail?: string;
}

interface AppState {
  user: UserProfile | null;
  theme: "dark" | "light";
  jobs: JobItem[];
  setUser: (user: UserProfile | null) => void;
  logout: () => void;
  setTheme: (theme: "dark" | "light") => void;
  toggleTheme: () => void;
  updateJob: (job: JobItem) => void;
  setJobs: (jobs: JobItem[]) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      theme: "dark",
      jobs: [],
      setUser: (user) => set({ user }),
      logout: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("auth_token");
        }
        set({ user: null });
      },
      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === "dark" ? "light" : "dark" })),
      updateJob: (newJob) =>
        set((state) => {
          const idx = state.jobs.findIndex((j) => j.job_id === newJob.job_id);
          if (idx >= 0) {
            const updated = [...state.jobs];
            updated[idx] = newJob;
            return { jobs: updated };
          }
          return { jobs: [newJob, ...state.jobs] };
        }),
      setJobs: (jobs) => set({ jobs }),
    }),
    {
      name: "app_state_storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user, theme: state.theme, jobs: state.jobs }),
    }
  )
);

