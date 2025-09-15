"use client";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, TrendingUp } from "lucide-react";
import ArticleCard from "@/components/ArticleCard";
import { Skeleton } from "@/components/ui/skeleton";

// Define a type for the article object received from the API
interface FetchedArticle {
  id: number;
  title: string;
  content: string;
  author: { name: string | null };
  createdAt: string;
  _count: { likes: number; comments: number };
  categories: { name: string }[];
}

const ArticlesPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("همه");
  const [articles, setArticles] = useState<FetchedArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const categories = [
    "همه",
    "فناوری",
    "تاریخ",
    "هنر و معماری",
    "علم",
    "فرهنگ",
    "سیاست",
    "اقتصاد",
    "ورزش",
    "سلامت",
    "محیط زیست",
  ];

  const fetchArticles = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (selectedCategory && selectedCategory !== "همه") {
        params.append("category", selectedCategory);
      }

      const response = await fetch(`/api/articles?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setArticles(data);
      }
    } catch (error) {
      console.error("Failed to fetch articles:", error);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchArticles();
    }, 300); // Debounce requests

    return () => clearTimeout(timer);
  }, [fetchArticles]);

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
                    variant={
                      selectedCategory === category ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
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
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-40 w-full" />
                ))}
              </div>
            ) : articles.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {articles.map((article) => (
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
                    likes={article._count.likes}
                    comments={article._count.comments}
                    category={article.categories[0]?.name || "عمومی"}
                  />
                ))}
              </div>
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
