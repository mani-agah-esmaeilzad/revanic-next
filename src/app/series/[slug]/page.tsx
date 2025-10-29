// src/app/series/[slug]/page.tsx
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import SeriesFollowButton from "@/components/SeriesFollowButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getUserIdFromSessionCookie } from "@/lib/auth-session";
import { getSeriesDetail } from "@/lib/series";

import { CheckCircle2, Circle, Clock } from "lucide-react";

interface SeriesDetailPageProps {
  params: { slug: string };
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));

const SeriesDetailPage = async ({ params }: SeriesDetailPageProps) => {
  const userId = await getUserIdFromSessionCookie();
  const series = await getSeriesDetail(params.slug, userId);

  if (!series) {
    notFound();
  }

  const nextEpisode =
    series.articles.find((item) => !item.isCompleted) ?? series.articles[series.articles.length - 1] ?? null;
  const followerLabel = new Intl.NumberFormat("fa-IR").format(series.followerCount);
  const completedLabel = `${series.completedCount} / ${series.articles.length}`;

  return (
    <div className="pb-12">
      <div className="relative overflow-hidden bg-journal-cream/60">
        <div className="container mx-auto flex flex-col gap-10 px-4 py-12 lg:flex-row lg:items-center">
          <div className="flex-1 space-y-6">
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <Badge variant="outline" className="border-journal-green text-journal-green">
                سری دنباله‌دار
              </Badge>
              <span>{followerLabel} دنبال‌کننده</span>
              <span className="text-journal-light/60">•</span>
              <span>{completedLabel} قسمت کامل شده</span>
              {series.curatorName ? (
                <>
                  <span className="text-journal-light/60">•</span>
                  <span>منتخب {series.curatorName}</span>
                </>
              ) : null}
            </div>
            <h1 className="text-3xl font-bold text-journal sm:text-5xl">{series.title}</h1>
            {series.subtitle ? (
              <p className="text-lg text-journal-light">{series.subtitle}</p>
            ) : null}
            {series.description ? (
              <p className="max-w-3xl text-base leading-relaxed text-journal-light">
                {series.description}
              </p>
            ) : null}
            <div className="max-w-xl space-y-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{series.progress}% پیشرفت</span>
                <span>{series.completedCount} قسمت مطالعه شده</span>
              </div>
              <Progress value={series.progress} className="h-2" />
            </div>
            <div className="flex flex-wrap gap-3">
              {nextEpisode ? (
                <Button asChild>
                  <Link href={`/articles/${nextEpisode.slug}`}>
                    {nextEpisode.isCompleted ? "مرور دوباره" : "ادامه مطالعه"}
                  </Link>
                </Button>
              ) : null}
              <SeriesFollowButton slug={series.slug} initialFollowing={series.isFollowing} />
            </div>
          </div>
          <div className="relative mx-auto h-64 w-full max-w-md overflow-hidden rounded-3xl bg-gradient-to-br from-journal-green/10 to-journal-cream lg:mx-0">
            {series.coverImageUrl ? (
              <Image
                src={series.coverImageUrl}
                alt={series.title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 420px"
              />
            ) : null}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="mx-auto mt-12 max-w-4xl space-y-6">
          {series.articles.map((episode) => (
            <Card
              key={episode.id}
              className="border-0 bg-white shadow-sm transition hover:shadow-md"
            >
              <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-1 items-start gap-4">
                  <div className="pt-1">
                    {episode.isCompleted ? (
                      <CheckCircle2 className="h-5 w-5 text-journal-green" />
                    ) : (
                      <Circle className="h-5 w-5 text-journal-light" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>قسمت {episode.order}</span>
                      <span className="text-journal-light/50">•</span>
                      <span>{formatDate(episode.publishDate)}</span>
                    </div>
                    <h2 className="text-lg font-semibold text-journal">{episode.title}</h2>
                    <p className="text-sm text-journal-light line-clamp-3">{episode.excerpt}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {episode.readTimeMinutes} دقیقه مطالعه
                    </div>
                  </div>
                </div>
                <Button asChild variant="outline" className="w-full sm:w-auto">
                  <Link href={`/articles/${episode.slug}`}>
                    {episode.isCompleted ? "مطالعه مجدد" : "مطالعه قسمت"}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SeriesDetailPage;
