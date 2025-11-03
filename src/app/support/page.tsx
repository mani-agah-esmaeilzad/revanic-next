// src/app/support/page.tsx
import type { Metadata } from "next";
import { SupportCenter } from "@/components/SupportCenter";

export const metadata: Metadata = {
  title: "پشتیبانی روانک",
  description: "ارسال و پیگیری تیکت‌های پشتیبانی در مجله روانک",
};

export default function SupportPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <SupportCenter />
    </div>
  );
}
