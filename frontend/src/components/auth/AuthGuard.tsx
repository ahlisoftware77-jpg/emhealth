"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import { Loader2 } from "lucide-react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAppStore((state) => state.user);
  const [checking, setChecking] = useState(true);

  const isLoginPage = pathname === "/login";

  useEffect(() => {
    // Cek status autentikasi dari state / token
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

    if (!isLoginPage && !user && !token) {
      router.replace("/login");
    } else if (isLoginPage && (user || token)) {
      router.replace("/dashboard");
    } else {
      setChecking(false);
    }
  }, [user, pathname, isLoginPage, router]);

  // Tampilkan loading saat memverifikasi sesi di halaman terproteksi
  if (checking && !isLoginPage) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground font-medium">Memeriksa hak akses...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
