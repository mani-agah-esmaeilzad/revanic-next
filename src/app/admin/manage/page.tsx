// src/app/admin/manage/page.tsx
import { AdminDashboard } from "@/components/AdminDashboard";
import { buildStaticMetadata } from "@/lib/page-metadata";

export const metadata = buildStaticMetadata({
  title: "مدیریت پیشرفته روانک",
  description: "ماژول‌های مدیریت داده و بررسی جزئیات محتوای مجله روانک.",
  path: "/admin/manage",
  keywords: ["مدیریت محتوا", "ادمین روانک"],
});

const AdminManagePage = () => {
    return (
        <div>
            <h1 className="text-3xl font-bold text-journal mb-8">مدیریت داده‌ها</h1>
            <AdminDashboard />
        </div>
    );
};

export default AdminManagePage;
