import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/components/providers/AppProvider";
import { MainLayout } from "@/components/layout/MainLayout";

export const metadata: Metadata = {
  title: "Data Utility Center - Production Web Utility",
  description: "Aplikasi pengolahan data Excel & gambar massal dengan streaming, fuzzy match, kompresi, OCR, dan job queue realtime.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="dark">
      <body className="antialiased selection:bg-primary selection:text-primary-foreground">
        <AppProvider>
          <MainLayout>{children}</MainLayout>
        </AppProvider>
      </body>
    </html>
  );
}
