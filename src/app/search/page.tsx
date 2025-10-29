// src/app/search/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search as SearchIcon, Newspaper, Users } from "lucide-react";
import ArticleCard from "@/components/ArticleCard";
import Link from "next/link";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Pagination } from "@/components/Pagination";

interface SearchResult {
  articles: any[];
  users: any[];
  totalPages: number;
}

const fetchSearchResults = async (query: string, page: number): Promise<SearchResult> => {
  if (!query) {
    return { articles: [], users: [], totalPages: 0 };
  }
  const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&page=${page}`);
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return response.json();
};

export default function SearchPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const initialQuery = searchParams.get("q") || "";
  const currentPage = Number(searchParams.get("page")) || 1;

  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);

  useEffect(() => {
    // FIX: Convert read-only searchParams to a string first
    const params = new URLSearchParams(searchParams.toString());
    if (debouncedQuery) {
      params.set("q", debouncedQuery);
      if (params.get('page') === null) {
        params.set("page", "1");
      }
    } else {
      params.delete("q");
    }
    router.replace(`${pathname}?${params.toString()}`);
  }, [debouncedQuery]);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);

    return () => clearTimeout(handler);
  }, [query]);

  const { data, isLoading, isError, error } = useQuery<SearchResult, Error>({
    queryKey: ["search", debouncedQuery, currentPage],
    queryFn: () => fetchSearchResults(debouncedQuery, currentPage),
    enabled: !!debouncedQuery,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };
  
  // This is a placeholder for a stricter Article type you might want to define
  type ArticleType = {
    id: number;
    slug: string;
    title: string;
    content: string;
    author: { name: string; avatarUrl?: string };
    createdAt: string;
    _count: { claps: number; comments: number };
    categories: { name: string }[];
    coverImageUrl?: string;
  };


  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">جستجو</h1>
        
        <div className="relative mb-8">
          <Input
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder="جستجوی مقاله، نویسنده یا تگ..."
            className="pl-10 h-12 text-lg"
          />
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        </div>

        <div className="space-y-8">
          {isLoading && (
            <div>
              <Skeleton className="h-8 w-1/4 mb-4" />
              <Skeleton className="h-24 w-full mb-2" />
              <Skeleton className="h-24 w-full" />
            </div>
          )}

          {isError && <p className="text-center text-red-500">خطا در جستجو: {error.message}</p>}

          {!isLoading && !isError && debouncedQuery && (
            <>
              <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Newspaper /> مقالات</h2>
                {data?.articles && data.articles.length > 0 ? (
                  <div className="space-y-4">
                    {data.articles.map((article: ArticleType) => (
                      <ArticleCard
                        key={article.id}
                        id={article.id.toString()}
                        slug={article.slug}
                        title={article.title}
                        excerpt={article.content.substring(0, 150) + "..."}
                        author={{ name: article.author.name || "ناشناس", avatar: article.author.avatarUrl }}
                        readTime={Math.ceil(article.content.length / 1000)}
                        publishDate={new Intl.DateTimeFormat("fa-IR").format(new Date(article.createdAt))}
                        claps={article._count.claps}
                        comments={article._count.comments}
                        category={article.categories[0]?.name || "عمومی"}
                        image={article.coverImageUrl}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">مقاله‌ای با این مشخصات یافت نشد.</p>
                )}
                {data && data.totalPages > 1 && (
                  <div className="mt-8">
                    <Pagination totalPages={data.totalPages} currentPage={currentPage} />
                  </div>
                )}
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Users /> نویسندگان</h2>
                {data?.users && data.users.length > 0 ? (
                   <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                     {data.users.map((user) => (
                      <Link href={`/authors/${user.id}`} key={user.id}>
                        <Card className="hover:bg-muted transition-colors">
                          <CardContent className="p-4 flex flex-col items-center text-center">
                            <Avatar className="h-20 w-20 mb-4 border-2">
                              <AvatarImage src={user.avatarUrl || ''} />
                              <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <p className="font-bold">{user.name}</p>
                            <p className="text-sm text-muted-foreground truncate w-full">{user.bio || 'بیوگرافی ثبت نشده'}</p>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                   </div>
                ) : (
                  <p className="text-muted-foreground">نویسنده‌ای با این مشخصات یافت نشد.</p>
                )}
              </section>
            </>
          )}

          {!debouncedQuery && !isLoading && (
            <div className="text-center py-16 text-muted-foreground">
              <SearchIcon className="mx-auto h-12 w-12 mb-4" />
              <p>برای شروع، عبارت مورد نظر خود را تایپ کنید.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}