// src/app/layout.tsx
import type { Metadata } from "next";
// --- تغییر اصلی: ما به طور کامل import مربوط به Viewport را حذف می‌کنیم ---
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Toaster } from "@/components/ui/toaster";
import QueryProvider from "@/components/QueryProvider";
import { InstallPWAButton } from "@/components/InstallPWAButton";

const vazirmatn = Vazirmatn({ subsets: ["arabic"] });

export const metadata: Metadata = {
  title: "Revanic - پلتفرم تولید محتوا",
  description: "جدیدترین مقالات و مطالب را در Revanic بخوانید و منتشر کنید.",
  manifest: "/manifest.json",
};

// --- تغییر اصلی: ما نوع `: Viewport` را از اینجا حذف می‌کنیم ---
export const viewport = {
  themeColor: "#FFFFFF",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body className={vazirmatn.className}>
        <QueryProvider>
          <Header />
          <main className="min-h-screen">{children}</main>
          <Footer />
          <Toaster />
          <InstallPWAButton />
        </QueryProvider>
      </body>
    </html>
  );
}