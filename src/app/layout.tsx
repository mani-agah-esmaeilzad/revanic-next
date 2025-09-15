import "./globals.css"; // این خط باید اینجا باشد
import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export const metadata: Metadata = {
  title: "مجله روانیک | پلتفرم انتشار مقالات فارسی",
  description: "مجله روانیک - پلتفرمی برای خواندن و نوشتن مقالات فارسی با کیفیت بالا",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        {/* این بخش برای لود شدن فونت وزیرمتن اضافه شد */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <TooltipProvider>
          <Header />
          <main>{children}</main>
          <Footer />
          <Toaster />
          <Sonner />
        </TooltipProvider>
      </body>
    </html>
  );
}
