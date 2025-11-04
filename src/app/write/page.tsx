import { buildStaticMetadata } from "@/lib/page-metadata";
import { WritePageClient } from "./WritePageClient";

export const metadata = buildStaticMetadata({
  title: "نوشتن مقاله در روانک",
  description: "مقاله جدید خود را در مجله روانک بنویسید، پیش‌نویس ذخیره کنید و با یک کلیک نسخه انگلیسی خودکار بسازید.",
  path: "/write",
  keywords: ["نوشتن مقاله", "ایجاد محتوا", "ترجمه خودکار"],
});

const WritePage = () => {
  return <WritePageClient />;
};

export default WritePage;
