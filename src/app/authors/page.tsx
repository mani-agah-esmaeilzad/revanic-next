"use client";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Search, Users, Star } from "lucide-react";
import Link from "next/link";
import { FollowButton } from "@/components/FollowButton";
import { Skeleton } from "@/components/ui/skeleton";

interface Author {
  id: number;
  name: string | null;
  _count: {
    followers: number;
    articles: number;
  };
}

const AuthorsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [authors, setAuthors] = useState<Author[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const usersPromise = fetch(`/api/users?search=${searchQuery}`);
      const followingPromise = fetch("/api/me/following");

      const [usersResponse, followingResponse] = await Promise.all([
        usersPromise,
        followingPromise,
      ]);

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setAuthors(usersData);
      }

      if (followingResponse.ok) {
        const followingData = await followingResponse.json();
        setFollowingIds(new Set(followingData.following));
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 300); // Debounce search

    return () => clearTimeout(timer);
  }, [fetchData]);

  return (
    <div className="min-h-screen bg-background">
      <section className="py-16 bg-journal-cream/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-journal mb-4">
              نویسندگان مجله روانیک
            </h1>
            <p className="text-xl text-journal-light mb-8">
              آشنایی با نویسندگان و متخصصان حوزه‌های مختلف
            </p>
            <div className="relative max-w-lg mx-auto">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-journal-light h-4 w-4" />
              <Input
                placeholder="جستجوی نویسندگان..."
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
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-64 w-full" />
                ))}
              </div>
            ) : authors.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {authors.map((author) => (
                  <Card
                    key={author.id}
                    className="group hover:shadow-medium transition-all duration-300 border-0 shadow-soft"
                  >
                    <CardContent className="p-6">
                      <div className="text-center">
                        <Avatar className="h-20 w-20 mx-auto mb-4">
                          <AvatarFallback className="text-xl bg-journal-green text-white">
                            {author.name?.charAt(0) || "؟"}
                          </AvatarFallback>
                        </Avatar>
                        <Link href={`/authors/${author.id}`}>
                          <h3 className="font-bold text-lg text-journal group-hover:text-journal-green transition-colors mb-2">
                            {author.name}
                          </h3>
                        </Link>
                        <div className="flex justify-around text-sm text-journal-light my-4">
                          <div className="text-center">
                            <div className="font-semibold text-journal">
                              {author._count.followers}
                            </div>
                            <div>دنبال‌کننده</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-journal">
                              {author._count.articles}
                            </div>
                            <div>مقاله</div>
                          </div>
                        </div>
                        <FollowButton
                          targetUserId={author.id}
                          initialFollowing={followingIds.has(author.id)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-journal-light text-lg">
                  هیچ نویسنده‌ای یافت نشد.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AuthorsPage;
