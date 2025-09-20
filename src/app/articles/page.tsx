
"use client";
import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter } from "lucide-react";
import ArticleCard from "@/components/ArticleCard";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";


interface FetchedArticle {
  id: number;
  title: string;
  content: string;
  coverImageUrl: string | null;
  author: { name: string | null };
  createdAt: string;
  _count: { likes: number; comments: number };
  categories: { name: string }[];
}

interface ApiResponse {
  articles: FetchedArticle[];
  pagination: {
    page: number;
    totalPages: number;
  }
}


const fetchArticles = async (page: number, query: string, category: string): Promise<ApiResponse> => {
  const params = new URLSearchParams();
  if (query) params.append("search", query);
  if (category && category !== "همه") {
    params.append("category", category);
  }
  params.append("page", String(page));
  params.append("limit", "6");

  const response = await fetch(`/api/articles?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
};


const ArticlesPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("همه");
  const [currentPage, setCurrentPage] = useState(1);

  const categories = useMemo(() => [
    "همه", "فناوری", "تاریخ", "هنر و معماری", "علم", "فرهنگ", "سیاست", "اقتصاد", "ورزش", "سلامت", "محیط زیست",
  ], []);

  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setCurrentPage(1); 
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  
  const { data, isLoading, isError } = useQuery<ApiResponse>({
    queryKey: ['articles', currentPage, debouncedQuery, selectedCategory],
    queryFn: () => fetchArticles(currentPage, debouncedQuery, selectedCategory),
  });

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= (data?.pagination.totalPages || 1)) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <section className="py-16 bg-journal-cream/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-journal mb-4">
              مقالات مجله روانیک
            </h1>
            <p className="text-xl text-journal-light mb-8">
              مجموعه‌ای از بهترین مقالات فارسی در موضوعات مختلف
            </p>
            <div className="relative max-w-lg mx-auto">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-journal-light h-4 w-4" />
              <Input
                placeholder="جستجو در مقالات..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 h-12 border-journal-green/20"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-4">
                <Filter className="h-5 w-5 text-journal-light" />
                <span className="font-medium text-journal">دسته‌بندی:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSelectedCategory(category)
                      setCurrentPage(1); 
                    }}
                    className={
                      selectedCategory === category
                        ? "bg-journal-green text-white"
                        : "border-journal-green/20 text-journal-light hover:bg-journal-green hover:text-white"
                    }
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-40 w-full" />
                ))}
              </div>
            ) : isError ? (
              <div className="text-center py-12">
                <p className="text-red-500 text-lg mb-4">
                  خطا در دریافت اطلاعات. لطفاً دوباره تلاش کنید.
                </p>
              </div>
            ) : data && data.articles.length > 0 ? (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {data.articles.map((article) => (
                    <ArticleCard
                      key={article.id}
                      id={article.id.toString()}
                      title={article.title}
                      excerpt={article.content.substring(0, 150) + "..."}
                      author={{ name: article.author.name || "ناشناس" }}
                      readTime={Math.ceil(article.content.length / 1000)}
                      publishDate={new Intl.DateTimeFormat("fa-IR").format(
                        new Date(article.createdAt),
                      )}
                      claps={article._count.likes}
                      comments={article._count.comments}
                      category={article.categories[0]?.name || "عمومی"}
                      image={article.coverImageUrl}
                    />
                  ))}
                </div>

                {data.pagination && data.pagination.totalPages > 1 && (
                  <div className="mt-12">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious onClick={() => handlePageChange(currentPage - 1)} />
                        </PaginationItem>
                        {[...Array(data.pagination.totalPages)].map((_, i) => (
                          <PaginationItem key={i}>
                            <PaginationLink
                              isActive={currentPage === i + 1}
                              onClick={() => handlePageChange(i + 1)}
                            >
                              {i + 1}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext onClick={() => handlePageChange(currentPage + 1)} />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-journal-light text-lg mb-4">
                  هیچ مقاله‌ای یافت نشد.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default ArticlesPage;