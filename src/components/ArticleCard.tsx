
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Clock, Hand, MessageCircle } from "lucide-react"; 
import Image from "next/image";

interface ArticleCardProps {
  id: string;
  title: string;
  excerpt: string;
  author: {
    name: string;
    avatar?: string;
  };
  readTime: number;
  publishDate: string;
  claps: number; 
  comments: number;
  category: string;
  image?: string | null;
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
  image
}: ArticleCardProps) => {
  return (
    <Card className="group hover:shadow-medium transition-all duration-300 border-0 shadow-soft">
      <CardContent className="p-0">
        <Link href={`/articles/${id}`} className="flex gap-4 p-6">
          <div className="flex-1">
            <div className="text-xs font-medium text-journal-orange mb-2">
              {category}
            </div>
            <h3 className="font-bold text-lg text-journal group-hover:text-journal-green transition-colors mb-2 line-clamp-2">
              {title}
            </h3>
            <p className="text-journal-light text-sm leading-relaxed mb-4 line-clamp-3">
              {excerpt}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={author.avatar} />
                  <AvatarFallback className="text-xs bg-journal-green text-white">
                    {author.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-journal-light">{author.name}</span>
                <span className="text-xs text-journal-light">•</span>
                <span className="text-xs text-journal-light">{publishDate}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-journal-light">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {readTime} دقیقه
                </div>
                <div className="flex items-center gap-1">
                  <Hand className="h-3 w-3" /> {}
                  {claps} {}
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-3 w-3" />
                  {comments}
                </div>
              </div>
            </div>
          </div>
          {image && (
            <div className="w-28 h-28 md:w-32 md:h-32 rounded-lg overflow-hidden flex-shrink-0 relative">
              <Image
                src={image}
                alt={title}
                fill
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