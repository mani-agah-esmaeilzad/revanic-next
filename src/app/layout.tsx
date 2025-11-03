import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Toaster } from "@/components/ui/toaster";
import QueryProvider from "@/components/QueryProvider";
import { ExperimentProvider } from "@/components/ExperimentProvider";
import { InstallPWAButton } from "@/components/InstallPWAButton";
import { SupportAssistantWidget } from "@/components/SupportAssistantWidget";
import { ThemeProvider } from "@/components/ThemeProvider";

const vazirmatn = Vazirmatn({ subsets: ["arabic"] });

export const metadata: Metadata = {
  title: "Revanac - پلتفرم تولید محتوا",
  description: "جدیدترین مقالات و مطالب را در Revanac بخوانید و منتشر کنید.",
  manifest: "/manifest.json",
};

// --- تغییر اصلی: ما نوع `: Viewport` را از اینجا حذف می‌کنیم ---
export const viewport = {
  themeColor: "#FFFFFF",
};

export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body className={vazirmatn.className}>
        <QueryProvider>
          <ThemeProvider>
            <Header />
            <main className="min-h-screen">{children}</main>
            <Footer />
            <Toaster />
            <InstallPWAButton />
            <SupportAssistantWidget />
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
