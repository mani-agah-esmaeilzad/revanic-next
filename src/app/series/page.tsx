// src/app/series/page.tsx
import Link from "next/link";

import SeriesCard from "@/components/SeriesCard";
import { Button } from "@/components/ui/button";
import { getUserIdFromSessionCookie } from "@/lib/auth-session";
import { getPublishedSeriesList } from "@/lib/series";
import { buildStaticMetadata } from "@/lib/page-metadata";

export const metadata = buildStaticMetadata({
  title: "سری‌های داستانی روانک",
  description: "سری‌های دنباله‌دار روانک را مرور کنید و در موضوعات تخصصی به‌صورت مرحله‌به‌مرحله مطالعه کنید.",
  path: "/series",
  keywords: ["سری مقالات", "سری‌های روانک", "مقالات دنباله‌دار"],
});

const SeriesPage = async () => {
  const userId = await getUserIdFromSessionCookie();
  const seriesList = await getPublishedSeriesList(userId);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold text-journal sm:text-5xl">سری‌های داستانی</h1>
        <p className="mt-4 text-base text-journal-light sm:text-lg">
          مجموعه‌ای از مقالات دنباله‌دار که شما را قدم‌به‌قدم در یک موضوع عمیق همراهی می‌کند.
        </p>
      </div>

      {seriesList.length === 0 ? (
        <div className="mx-auto mt-16 max-w-lg rounded-3xl bg-journal-cream/40 p-10 text-center">
          <p className="text-lg font-semibold text-journal">هنوز سری‌ای منتشر نشده است.</p>
          <p className="mt-2 text-sm text-journal-light">
            اگر دوست دارید موضوعی را به‌صورت سلسله‌وار پوشش دهید، اولین سری روانک را شما بسازید.
          </p>
          <Button asChild className="mt-6">
            <Link href="/write">شروع نوشتن یک سری جدید</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {seriesList.map((series) => (
            <SeriesCard key={series.id} series={series} />
          ))}
        </div>
      )}
    </div>
  );
};

export default SeriesPage;
