import { buildStaticMetadata } from "@/lib/page-metadata";
import { AdminDashboardClient } from "./AdminDashboardClient";

export const metadata = buildStaticMetadata({
  title: "داشبورد مدیریت روانک",
  description: "نظارت بر آمار کاربران، مقالات و وضعیت انتشار در مرکز مدیریتی مجله روانک.",
  path: "/admin",
  keywords: ["داشبورد ادمین", "مدیریت روانک"],
});

const AdminDashboardPage = () => {
  return <AdminDashboardClient />;
};

export default AdminDashboardPage;
