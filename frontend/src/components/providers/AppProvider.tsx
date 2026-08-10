"use client";

import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAppStore } from "@/store/useAppStore";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { theme, updateJob } = useAppStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Apply theme class to <html>
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  useEffect(() => {
    // SSE Stream for Realtime Job Progress Updates
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8003/api/v1";
    const eventSource = new EventSource(`${apiUrl}/job-queue/stream/events`);

    eventSource.onmessage = (event) => {
      try {
        const jobData = JSON.parse(event.data);
        if (jobData && jobData.job_id) {
          updateJob(jobData);
        }
      } catch (err) {
        console.error("SSE parse error:", err);
      }
    };

    return () => {
      eventSource.close();
    };
  }, [updateJob]);

  if (!mounted) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
        {children}
      </div>
    </QueryClientProvider>
  );
}
