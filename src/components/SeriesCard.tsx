// src/components/SeriesCard.tsx
import Link from "next/link";
import Image from "next/image";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { SeriesListItem } from "@/lib/series";
import { cn } from "@/lib/utils";

interface SeriesCardProps {
  series: SeriesListItem;
  className?: string;
}

const SeriesCard = ({ series, className }: SeriesCardProps) => {
  const progressLabel = series.progress > 0 ? `${series.progress}% تکمیل شده` : "شروع نشده";

  return (
    <Card className={cn("overflow-hidden border-0 shadow-soft transition hover:shadow-medium", className)}>
      {series.coverImageUrl ? (
        <div className="relative h-40 w-full">
          <Image
            src={series.coverImageUrl}
            alt={series.title}
            fill
            sizes="(max-width: 768px) 100vw, 400px"
            className="object-cover"
          />
        </div>
      ) : (
        <div className="h-40 w-full bg-gradient-to-br from-journal-cream to-journal-cream/40" />
      )}
      <CardHeader className="space-y-2">
        <CardTitle className="text-xl font-semibold text-journal">{series.title}</CardTitle>
        {series.subtitle ? (
          <p className="text-sm text-journal-light">{series.subtitle}</p>
        ) : null}
        {series.isFollowing ? (
          <Badge variant="outline" className="border-journal-green text-journal-green">
            در حال دنبال کردن
          </Badge>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-journal-light">
        {series.description ? (
          <p className="leading-relaxed">{series.description}</p>
        ) : (
          <p className="text-journal-light/70">این سری هنوز توضیح کوتاهی ندارد.</p>
        )}
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>شامل {series.articleCount} قسمت</span>
          <span className="mx-1 text-journal-light/50">•</span>
          <span>{series.followerCount} دنبال‌کننده</span>
          {series.curatorName ? (
            <>
              <span className="mx-1 text-journal-light/50">•</span>
              <span>منتخب {series.curatorName}</span>
            </>
          ) : null}
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>{progressLabel}</span>
            <span>{series.completedCount} قسمت خوانده شده</span>
          </div>
          <Progress value={series.progress} className="h-2" />
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link href={`/series/${series.slug}`}>ادامه مطالعه</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SeriesCard;
