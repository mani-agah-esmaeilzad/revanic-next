// src/components/ArticleCard.tsx
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Clock, Hand, MessageCircle } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ArticleCardProps {
  id: string;
  title: string;
  excerpt: string;
  author: {
    name: string;
    avatar?: string | null;
  };
  readTime: number;
  publishDate: string;
  claps: number;
  comments: number;
  category: string;
  image?: string | null;
  className?: string;
}

const ArticleCard = ({
  id,
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
  return (
    <Card
      className={cn(
        "group border-0 shadow-soft transition-all duration-300 hover:shadow-medium",
        className
      )}
    >
      <CardContent className="p-0">
        <Link
          href={`/articles/${id}`}
          className="flex flex-col gap-4 p-6 md:flex-row md:items-stretch"
        >
          <div className="flex-1 space-y-3">
            <div className="text-xs font-medium text-journal-orange">{category}</div>
            <h3 className="font-bold text-lg text-journal group-hover:text-journal-green transition-colors line-clamp-2">
              {title}
            </h3>
            <p className="text-journal-light text-sm leading-relaxed line-clamp-3">{excerpt}</p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-journal-light">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={author.avatar || ""} />
                  <AvatarFallback className="bg-journal-green text-white">
                    {author.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span>{author.name}</span>
                <span className="hidden sm:inline">•</span>
                <span>{publishDate}</span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-journal-light">
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {readTime} دقیقه مطالعه
                </div>
                <div className="flex items-center gap-1">
                  <Hand className="h-3.5 w-3.5" />
                  {claps}
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-3.5 w-3.5" />
                  {comments}
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