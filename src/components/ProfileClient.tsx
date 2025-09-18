// src/components/ProfileClient.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Edit3, LogOut, Crown } from "lucide-react";
import ArticleCard from "@/components/ArticleCard";
import { useRouter } from "next/navigation";
import { ProfileSettings } from "./ProfileSettings";
import { DeleteArticleButton } from "./DeleteArticleButton";
import { Skeleton } from "./ui/skeleton";
import { AnalyticsDashboard } from "./AnalyticsDashboard";

type ArticleStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

// تعریف نوع داده‌ها برای هماهنگی کامل با بک‌اند
interface Subscription {
  tier: string;
  status: string;
}

interface Article {
  id: number;
  title: string;
  content: string;
  createdAt: Date;
  status: ArticleStatus;
  coverImageUrl: string | null;
  author: { name: string | null };
  _count: { likes: number; comments: number };
  categories: { name: string }[];
}

interface UserData {
  id: number;
  name: string | null;
  email: string;
  bio: string | null;
  articles: Article[];
  createdAt: Date;
  subscription: Subscription | null;
}

interface ProfileClientProps {
  user: UserData;
}

const LogoutButton = () => {
  const router = useRouter();
  const handleLogout = async () => {
    const response = await fetch("/api/auth/logout", { method: "POST" });
    if (response.ok) {
      router.push("/login");
      router.refresh();
    }
  };
  return (
    <Button
      onClick={handleLogout}
      variant="destructive"
      className="flex items-center gap-2"
    >
      <LogOut className="h-4 w-4" />
      خروج از حساب
    </Button>
  );
};

const ArticleStatusBadge = ({ status }: { status: ArticleStatus }) => {
  switch (status) {
    case 'APPROVED': return <Badge className="bg-green-500 text-white">تایید شده</Badge>;
    case 'PENDING': return <Badge className="bg-yellow-500 text-yellow-900">در انتظار تایید</Badge>;
    case 'REJECTED': return <Badge variant="destructive">رد شده</Badge>;
    default: return <Badge variant="outline">نامشخص</Badge>;
  }
}

const getSubscriptionText = (subscription: Subscription | null): string => {
  if (!subscription) return "رایگان";

  switch (subscription.tier) {
    case 'STUDENT':
      if (subscription.status === 'ACTIVE') return "دانشجویی";
      if (subscription.status === 'PENDING_VERIFICATION') return "در انتظار تایید";
      return "دانشجویی (رد شده)";
    case 'MONTHLY': return "ماهانه";
    case 'YEARLY': return "سالانه";
    case 'TRIAL': return "آزمایشی";
    default: return "رایگان";
  }
};

export const ProfileClient = ({ user }: ProfileClientProps) => {
  const joinDate = new Intl.DateTimeFormat("fa-IR").format(new Date(user.createdAt));
  const [savedArticles, setSavedArticles] = useState<Article[]>([]);
  const [likedArticles, setLikedArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState({ saved: true, liked: true });

  const fetchSavedArticles = async () => {
    setIsLoading(prev => ({ ...prev, saved: true }));
    try {
      const response = await fetch('/api/me/bookmarks');
      if (response.ok) {
        const data = await response.json();
        setSavedArticles(data);
      }
    } catch (error) {
      console.error("Failed to fetch saved articles", error);
    } finally {
      setIsLoading(prev => ({ ...prev, saved: false }));
    }
  }

  const fetchLikedArticles = async () => {
    setIsLoading(prev => ({ ...prev, liked: true }));
    try {
      const response = await fetch('/api/me/likes');
      if (response.ok) {
        const data = await response.json();
        setLikedArticles(data);
      }
    } catch (error) {
      console.error("Failed to fetch liked articles", error);
    } finally {
      setIsLoading(prev => ({ ...prev, liked: false }));
    }
  }

  const onTabChange = (value: string) => {
    if (value === 'saved' && savedArticles.length === 0) fetchSavedArticles();
    if (value === 'liked' && likedArticles.length === 0) fetchLikedArticles();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* هدر پروفایل */}
            <Card className="mb-8 shadow-soft border-0">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex flex-col items-center md:items-start">
                    <Avatar className="h-32 w-32 mb-4">
                      <AvatarImage src={""} />
                      <AvatarFallback className="bg-journal-green text-white font-bold text-4xl">
                        {user.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Edit3 className="h-4 w-4" />
                      تغییر تصویر
                    </Button>
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                      <div>
                        <h1 className="text-3xl font-bold text-journal mb-2">{user.name}</h1>
                        <p className="text-journal-light mb-2">{user.email}</p>
                        <div className="flex items-center gap-2 mb-4">
                          <Badge
                            variant="secondary"
                            className="flex items-center gap-1"
                          >
                            <Crown className="h-3 w-3" />
                            اشتراک {getSubscriptionText(user.subscription)}
                          </Badge>
                          <span className="text-sm text-journal-light">
                            عضو از {joinDate}
                          </span>
                        </div>
                      </div>
                      <LogoutButton />
                    </div>
                    <p className="text-journal-light mb-6">
                      {user.bio || "بیوگرافی شما در اینجا نمایش داده می‌شود."}
                    </p>
                    <div className="grid grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-journal">{user.articles.length}</div>
                        <div className="text-sm text-journal-light">مقاله</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-journal">0</div>
                        <div className="text-sm text-journal-light">پسند</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-journal">0</div>
                        <div className="text-sm text-journal-light">
                          دنبال‌کننده
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* تب‌ها */}
            <Tabs defaultValue="articles" className="w-full" onValueChange={onTabChange}>
              <TabsList className="grid w-full grid-cols-5 mb-8">
                <TabsTrigger value="articles">مقالات من</TabsTrigger>
                <TabsTrigger value="analytics">آمار</TabsTrigger>
                <TabsTrigger value="saved">ذخیره شده</TabsTrigger>
                <TabsTrigger value="liked">پسندیده</TabsTrigger>
                <TabsTrigger value="settings">تنظیمات</TabsTrigger>
              </TabsList>

              <TabsContent value="articles">
                <Card className="shadow-soft border-0">
                  <CardHeader><CardTitle>مقالات من</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {user.articles.length > 0 ? (
                        user.articles.map((article) => (
                          <div
                            key={article.id}
                            className="flex items-center gap-4"
                          >
                            <div className="flex-grow">
                              <ArticleCard
                                id={article.id.toString()}
                                title={article.title}
                                excerpt={article.content.substring(0, 150) + "..."}
                                image={article.coverImageUrl}
                                author={{
                                  name: user.name || "Unknown",
                                  avatar: "",
                                }}
                                readTime={Math.ceil(
                                  article.content.length / 1000,
                                )}
                                publishDate={new Intl.DateTimeFormat(
                                  "fa-IR",
                                ).format(new Date(article.createdAt))}
                                likes={article._count.likes}
                                comments={article._count.comments}
                                category={article.categories[0]?.name || "عمومی"}
                              />
                            </div>
                            <div className="flex flex-col items-center gap-2">
                              <ArticleStatusBadge status={article.status} />
                              <DeleteArticleButton articleId={article.id} />
                            </div>
                          </div>
                        ))
                      ) : (
                        <p>شما هنوز مقاله‌ای ننوشته‌اید.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics">
                <AnalyticsDashboard />
              </TabsContent>

              <TabsContent value="saved">
                <Card className="shadow-soft border-0">
                  <CardHeader><CardTitle>مقالات ذخیره شده</CardTitle></CardHeader>
                  <CardContent>
                    {isLoading.saved ? (
                      <div className="space-y-4">
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                      </div>
                    ) : savedArticles.length > 0 ? (
                      <div className="space-y-6">
                        {savedArticles.map((article) => (
                          <ArticleCard
                            key={article.id}
                            id={article.id.toString()}
                            title={article.title}
                            excerpt={article.content.substring(0, 150) + "..."}
                            image={article.coverImageUrl}
                            author={{ name: article.author.name || "ناشناس" }}
                            readTime={Math.ceil(article.content.length / 1000)}
                            publishDate={new Intl.DateTimeFormat("fa-IR").format(new Date(article.createdAt))}
                            likes={article._count.likes}
                            comments={article._count.comments}
                            category={article.categories[0]?.name || "عمومی"}
                          />
                        ))}
                      </div>
                    ) : (
                      <p>شما هنوز هیچ مقاله‌ای را ذخیره نکرده‌اید.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="liked">
                <Card className="shadow-soft border-0">
                  <CardHeader><CardTitle>مقالات پسندیده</CardTitle></CardHeader>
                  <CardContent>
                    {isLoading.liked ? (
                      <div className="space-y-4">
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                      </div>
                    ) : likedArticles.length > 0 ? (
                      <div className="space-y-6">
                        {likedArticles.map((article) => (
                          <ArticleCard
                            key={article.id}
                            id={article.id.toString()}
                            title={article.title}
                            excerpt={article.content.substring(0, 150) + "..."}
                            image={article.coverImageUrl}
                            author={{ name: article.author.name || "ناشناس" }}
                            readTime={Math.ceil(article.content.length / 1000)}
                            publishDate={new Intl.DateTimeFormat("fa-IR").format(new Date(article.createdAt))}
                            likes={article._count.likes}
                            comments={article._count.comments}
                            category={article.categories[0]?.name || "عمومی"}
                          />
                        ))}
                      </div>
                    ) : (
                      <p>شما هنوز هیچ مقاله‌ای را نپسندیده‌اید.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings">
                <ProfileSettings user={user} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};