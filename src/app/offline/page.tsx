import { buildStaticMetadata } from "@/lib/page-metadata";

export const metadata = buildStaticMetadata({
  title: "حالت آفلاین روانک",
  description: "برای استفاده کامل از مجله روانک به اینترنت متصل شوید و صفحه را پس از اتصال تازه‌سازی کنید.",
  path: "/offline",
});

const OfflinePage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-journal-cream/40 text-center px-6">
      <h1 className="text-3xl md:text-4xl font-bold text-journal mb-4">بدون اتصال اینترنت هستید</h1>
      <p className="text-journal-light max-w-xl mb-8">
        برای ادامه مطالعه به اینترنت متصل شوید. می‌توانید مقالات ذخیره شده در حافظه مرورگر را پس از اتصال مشاهده کنید.
      </p>
      <p className="text-sm text-muted-foreground">
        پس از برقراری اتصال، صفحه را تازه‌سازی کنید تا جدیدترین محتوا بارگذاری شود.
      </p>
    </div>
  );
};

export default OfflinePage;
