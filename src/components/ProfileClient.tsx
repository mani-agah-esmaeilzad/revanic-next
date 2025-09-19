// src/components/ProfileClient.tsx
"use client";

import { useState } from "react";
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
import { useQuery } from "@tanstack/react-query";
import { Prisma } from "@prisma/client";

// =======================================================================
//  1. تعریف تایپ‌ها (Types)
// =======================================================================

// A helper type to get the full user object with relations from Prisma
type UserPayload = Prisma.UserGetPayload<{
  include: {
    subscription: true,
    articles: {
      include: {
        author: { select: { name: true } },
        _count: { select: { claps: true, comments: true, views: true } },
        categories: { select: { name: true } },
      },
    },
  },
}>;

// The main UserData type now uses the Prisma payload
type UserData = UserPayload;

type Article = UserData['articles'][0];
type Subscription = UserData['subscription'];
type ArticleStatus = Article['status'];

interface ProfileClientProps {
  user: UserData;
}

// =======================================================================
//  2. توابع دریافت داده (Data Fetching Functions)
// =======================================================================

const fetchSavedArticles = async (): Promise<Article[]> => {
    const response = await fetch('/api/me/bookmarks');
    if (!response.ok) {
        throw new Error('Failed to fetch saved articles');
    }
    return response.json();
};

const fetchClappedArticles = async (): Promise<Article[]> => {
    const response = await fetch('/api/me/claps');
    if (!response.ok) {
        throw new Error('Failed to fetch clapped articles');
    }
    return response.json();
};


// =======================================================================
//  3. کامپوننت‌های کوچک و کمکی (Helper Components)
// =======================================================================

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


// =======================================================================
//  4. کامپوننت اصلی (Main Component)
// =======================================================================

export const ProfileClient = ({ user }: ProfileClientProps) => {
  const joinDate = new Intl.DateTimeFormat("fa-IR").format(new Date(user.createdAt));
  const [activeTab, setActiveTab] = useState("articles");

  // استفاده از useQuery برای دریافت داده‌های تب "ذخیره شده"
  const { data: savedArticles, isLoading: isLoadingSaved, isError: isErrorSaved } = useQuery<Article[]>({
    queryKey: ['savedArticles'],
    queryFn: fetchSavedArticles,
    enabled: activeTab === 'saved', // فقط زمانی دیتا رو بگیر که این تب فعال باشه
  });
  
  // استفاده از useQuery برای دریافت داده‌های تب "تشویق شده"
  const { data: clappedArticles, isLoading: isLoadingClapped, isError: isErrorClapped } = useQuery<Article[]>({
    queryKey: ['clappedArticles'],
    queryFn: fetchClappedArticles,
    enabled: activeTab === 'clapped', // فقط زمانی دیتا رو بگیر که این تب فعال باشه
  });

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
                        <div className="text-sm text-journal-light">دنبال‌کننده</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-journal">0</div>
                        <div className="text-sm text-journal-light">
                          دنبال‌شونده
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* تب‌ها */}
            <Tabs defaultValue="articles" className="w-full" onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5 mb-8">
                <TabsTrigger value="articles">مقالات من</TabsTrigger>
                <TabsTrigger value="analytics">آمار</TabsTrigger>
                <TabsTrigger value="saved">ذخیره شده</TabsTrigger>
                <TabsTrigger value="clapped">تشویق شده</TabsTrigger>
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
                                author={{ name: user.name || "Unknown" }}
                                readTime={Math.ceil(article.content.length / 1000)}
                                publishDate={new Intl.DateTimeFormat("fa-IR").format(new Date(article.createdAt))}
                                claps={article._count.claps}
                                comments={article._count.comments}
                                category={article.categories[0]?.name || "عمومی"}
                              />
                            </div>
                            <div className="flex flex-col items-center gap-2">
                              <ArticleStatusBadge status={article.status as ArticleStatus} />
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
                    {isLoadingSaved ? (
                      <div className="space-y-4">
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                      </div>
                    ) : isErrorSaved ? (
                      <p className="text-red-500">خطا در دریافت مقالات ذخیره شده.</p>
                    ) : savedArticles && savedArticles.length > 0 ? (
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
                            claps={article._count.claps}
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

              <TabsContent value="clapped">
                <Card className="shadow-soft border-0">
                  <CardHeader><CardTitle>مقالات تشویق شده</CardTitle></CardHeader>
                  <CardContent>
                    {isLoadingClapped ? (
                      <div className="space-y-4">
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                      </div>
                    ) : isErrorClapped ? (
                        <p className="text-red-500">خطا در دریافت مقالات تشویق شده.</p>
                    ) : clappedArticles && clappedArticles.length > 0 ? (
                      <div className="space-y-6">
                        {clappedArticles.map((article) => (
                          <ArticleCard
                            key={article.id}
                            id={article.id.toString()}
                            title={article.title}
                            excerpt={article.content.substring(0, 150) + "..."}
                            image={article.coverImageUrl}
                            author={{ name: article.author.name || "ناشناس" }}
                            readTime={Math.ceil(article.content.length / 1000)}
                            publishDate={new Intl.DateTimeFormat("fa-IR").format(new Date(article.createdAt))}
                            claps={article._count.claps}
                            comments={article._count.comments}
                            category={article.categories[0]?.name || "عمومی"}
                          />
                        ))}
                      </div>
                    ) : (
                      <p>شما هنوز هیچ مقاله‌ای را تشویق نکرده‌اید.</p>
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