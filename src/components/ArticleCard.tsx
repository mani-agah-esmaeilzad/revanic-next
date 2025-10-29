// src/components/ArticleCard.tsx
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Clock, Hand, MessageCircle } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export interface ArticleCardProps {
  id: string | number;
  slug: string;
  title: string;
  excerpt?: string | null;
  author: {
    name: string | null;
    avatar?: string | null;
    avatarUrl?: string | null;
  };
  readTime?: number | null;
  publishDate?: string | null;
  claps?: number | null;
  comments?: number | null;
  category?: string | null;
  image?: string | null;
  className?: string;
}

const ArticleCard = ({
  id,
  slug,
  title,
  excerpt,
  author,
  readTime,
  publishDate,
  claps,
  comments,
  category,
  image,
  className,
}: ArticleCardProps) => {
  const articleSlug = slug || (typeof id === "number" ? id.toString() : `${id}`);
  const authorName = author.name?.trim() || "ناشناس";
  const avatarSource = author.avatar ?? author.avatarUrl ?? "";
  const excerptText = excerpt?.trim() || "";
  const safeReadTime = readTime && readTime > 0 ? readTime : 1;
  const safePublishDate = publishDate?.trim() || null;
  const safeClaps = claps ?? 0;
  const safeComments = comments ?? 0;
  const safeCategory = category?.trim() || "عمومی";
  const avatarInitial = authorName.charAt(0) || "ر";

  return (
    <Card
      className={cn(
        "group border-0 shadow-soft transition-all duration-300 hover:shadow-medium",
        className
      )}
    >
      <CardContent className="p-0">
        <Link
          href={`/articles/${articleSlug}`}
          className="flex flex-col gap-4 p-6 md:flex-row md:items-stretch"
        >
          <div className="flex-1 space-y-3">
            <div className="text-xs font-medium text-journal-orange">{safeCategory}</div>
            <h3 className="font-bold text-lg text-journal group-hover:text-journal-green transition-colors line-clamp-2">
              {title}
            </h3>
            {excerptText ? (
              <p className="text-journal-light text-sm leading-relaxed line-clamp-3">{excerptText}</p>
            ) : (
              <p className="text-journal-light/70 text-sm leading-relaxed">
                پیش‌نمایش این مقاله هنوز آماده نیست.
              </p>
            )}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-journal-light">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={avatarSource} />
                  <AvatarFallback className="bg-journal-green text-white">
                    {avatarInitial}
                  </AvatarFallback>
                </Avatar>
                <span>{authorName}</span>
                {safePublishDate ? (
                  <>
                    <span className="hidden sm:inline">•</span>
                    <span>{safePublishDate}</span>
                  </>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-journal-light">
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {safeReadTime} دقیقه مطالعه
                </div>
                <div className="flex items-center gap-1">
                  <Hand className="h-3.5 w-3.5" />
                  {safeClaps}
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-3.5 w-3.5" />
                  {safeComments}
                </div>
              </div>
            </div>
          </div>
          {image && (
            <div className="relative h-40 w-full overflow-hidden rounded-xl md:h-auto md:w-32 md:flex-shrink-0">
              <Image
                src={image}
                alt={title}
                fill
                sizes="(max-width: 768px) 100vw, 128px"
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          )}
        </Link>
      </CardContent>
    </Card>
  );
};

export default ArticleCard;
