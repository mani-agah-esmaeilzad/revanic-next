// src/components/ProfileClient.tsx
"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Edit3, LogOut, Crown, Loader2, Pin, PinOff, History, Download } from "lucide-react";
import ArticleCard from "@/components/ArticleCard";
import { useRouter } from "next/navigation";
import { ProfileSettings } from "./ProfileSettings";
import { DeleteArticleButton } from "./DeleteArticleButton";
import { Skeleton } from "./ui/skeleton";
import { AnalyticsDashboard } from "./AnalyticsDashboard";
import { useQuery, useMutation, useQueryClient, QueryFunctionContext } from "@tanstack/react-query";
import { Prisma } from "@prisma/client";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// =======================================================================
//  1. تعریف تایپ‌ها (Types)
// =======================================================================

// تایپ انعطاف‌پذیر برای مقالاتی که از API های مختلف دریافت می‌شوند
type FetchedArticle = Prisma.ArticleGetPayload<{
  include: {
    author: { select: { name: true, avatarUrl: true } }; // `avatarUrl` اینجا ضروری است
    _count: { select: { claps: true, comments: true, views?: true } };
    categories: { select: { name: true } };
  }
}>;

type ReadingHistoryItem = {
  viewedAt: string;
  article: FetchedArticle;
};

const HISTORY_RANGE_LABELS: Record<string, string> = {
  "7d": "۷ روز اخیر",
  "30d": "۳۰ روز اخیر",
  "90d": "۹۰ روز اخیر",
  "365d": "۱ سال اخیر",
  all: "همه زمان‌ها",
};

// تایپ اصلی برای داده‌های کاربر که از صفحه سرور می‌آید
type UserPayload = Prisma.UserGetPayload<{
  include: {
    subscription: true;
    articles: {
      include: {
        author: { select: { name: true } };
        _count: { select: { claps: true, comments: true, views: true } };
        categories: { select: { name: true } };
      };
    };
    _count: {
      select: {
        followers: true;
        following: true;
      };
    };
    pinnedArticle: true;
  };
}>;

type UserData = UserPayload;
type Subscription = UserData["subscription"];
type ArticleStatus = FetchedArticle["status"];

interface ProfileClientProps {
  user: UserData;
}

// =======================================================================
//  2. توابع Fetcher
// =======================================================================
const fetchSavedArticles = async (): Promise<FetchedArticle[]> => {
  const response = await fetch("/api/me/bookmarks");
  if (!response.ok) throw new Error("Failed to fetch saved articles");
  return response.json();
};

const fetchClappedArticles = async (): Promise<FetchedArticle[]> => {
  const response = await fetch("/api/me/claps");
  if (!response.ok) throw new Error("Failed to fetch clapped articles");
  return response.json();
};

const pinArticleRequest = async (articleId: number | null) => {
  const response = await fetch('/api/me/pin-article', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ articleId }),
  });
  if (!response.ok) {
    throw new Error('Failed to update pin status');
  }
  return response.json();
};

const fetchReadingHistory = async (
  { queryKey }: QueryFunctionContext<
    readonly [
      string,
      { search?: string; range: string; categoryId?: number | null }
    ]
  >
): Promise<ReadingHistoryItem[]> => {
  const [, params] = queryKey;
  const urlParams = new URLSearchParams();

  if (params.search) {
    urlParams.set("q", params.search);
  }

  if (params.range) {
    urlParams.set("range", params.range);
  }

  if (params.categoryId) {
    urlParams.set("categoryId", params.categoryId.toString());
  }

  const queryString = urlParams.toString();
  const response = await fetch(
    `/api/me/reading-history${queryString ? `?${queryString}` : ""}`
  );
  if (!response.ok) throw new Error("Failed to fetch reading history");
  return response.json();
};

// =======================================================================
//  3. کامپوننت‌های کمکی
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
//  4. کامپوننت اصلی
// =======================================================================
export const ProfileClient = ({ user }: ProfileClientProps) => {
  const joinDate = new Intl.DateTimeFormat("fa-IR").format(new Date(user.createdAt));
  const [activeTab, setActiveTab] = useState("articles");

  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [pinnedArticleId, setPinnedArticleId] = useState(user.pinnedArticleId);
  const [historyRange, setHistoryRange] = useState("30d");
  const [historySearch, setHistorySearch] = useState("");
  const [debouncedHistorySearch, setDebouncedHistorySearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedHistorySearch(historySearch.trim());
    }, 400);

    return () => clearTimeout(timer);
  }, [historySearch]);

  const historyFilters = useMemo(
    () => ({
      search: debouncedHistorySearch || undefined,
      range: historyRange,
    }),
    [debouncedHistorySearch, historyRange]
  );

  const currentRangeLabel = HISTORY_RANGE_LABELS[historyRange] ?? HISTORY_RANGE_LABELS["30d"];

  const handleExportHistory = () => {
    const params = new URLSearchParams();
    if (debouncedHistorySearch) {
      params.set("q", debouncedHistorySearch);
    }
    if (historyRange) {
      params.set("range", historyRange);
    }

    const queryString = params.toString();
    if (typeof window !== "undefined") {
      window.open(
        `/api/me/reading-history/export${queryString ? `?${queryString}` : ""}`,
        "_blank"
      );
    }
  };

  const { data: savedArticles, isLoading: isLoadingSaved, isError: isErrorSaved } = useQuery<FetchedArticle[]>({
    queryKey: ['savedArticles'],
    queryFn: fetchSavedArticles,
    enabled: activeTab === 'saved',
  });

  const { data: clappedArticles, isLoading: isLoadingClapped, isError: isErrorClapped } = useQuery<FetchedArticle[]>({
    queryKey: ['clappedArticles'],
    queryFn: fetchClappedArticles,
    enabled: activeTab === 'clapped',
  });

  const { data: historyArticles, isLoading: isLoadingHistory, isError: isErrorHistory } = useQuery<ReadingHistoryItem[]>({
    queryKey: ['readingHistory', historyFilters],
    queryFn: fetchReadingHistory,
    enabled: activeTab === 'history',
  });

  const pinMutation = useMutation({
    mutationFn: pinArticleRequest,
    onSuccess: (data) => {
      setPinnedArticleId(data.pinnedArticleId);
      toast({ title: "موفقیت", description: "وضعیت پین مقاله به‌روز شد." });
      queryClient.invalidateQueries({ queryKey: ['author-profile', user.id.toString()] });
    },
    onError: () => {
      toast({ title: "خطا", description: "عملیات ناموفق بود.", variant: "destructive" });
    }
  });

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await fetch('/api/me/avatar', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Upload failed');
      const data = await response.json();
      setAvatarUrl(data.url);
      toast({ title: "موفقیت‌آمیز", description: "تصویر پروفایل شما با موفقیت به‌روز شد." });
    } catch (error) {
      toast({ title: "خطا", description: "آپلود تصویر با خطا مواجه شد.", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <Card className="mb-8 shadow-soft border-0">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex flex-col items-center md:items-start">
                    <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} className="hidden" accept="image/*" />
                    <Avatar className="h-32 w-32 mb-4 cursor-pointer relative group" onClick={() => !isUploading && fileInputRef.current?.click()}>
                      <AvatarImage src={avatarUrl || ""} />
                      <AvatarFallback className="bg-journal-green text-white font-bold text-4xl">{user.name?.charAt(0) || "U"}</AvatarFallback>
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                        {isUploading ? <Loader2 className="h-8 w-8 text-white animate-spin" /> : <Edit3 className="h-8 w-8 text-white" />}
                      </div>
                    </Avatar>
                    <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                      {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Edit3 className="h-4 w-4" />}
                      {isUploading ? 'در حال آپلود...' : 'تغییر تصویر'}
                    </Button>
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                      <div>
                        <h1 className="text-3xl font-bold text-journal mb-2">{user.name}</h1>
                        <p className="text-journal-light mb-2">{user.email}</p>
                        <div className="flex items-center gap-2 mb-4">
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Crown className="h-3 w-3" />
                            اشتراک {getSubscriptionText(user.subscription)}
                          </Badge>
                          <span className="text-sm text-journal-light">عضو از {joinDate}</span>
                        </div>
                      </div>
                      <LogoutButton />
                    </div>
                    <p className="text-journal-light mb-6">{user.bio || "بیوگرافی شما در اینجا نمایش داده می‌شود."}</p>
                    <div className="grid grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-journal">{user.articles.length}</div>
                        <div className="text-sm text-journal-light">مقاله</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-journal">{user._count.followers}</div>
                        <div className="text-sm text-journal-light">دنبال‌کننده</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-journal">{user._count.following}</div>
                        <div className="text-sm text-journal-light">دنبال‌شونده</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="articles" className="w-full" onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-6 mb-8">
                <TabsTrigger value="articles">مقالات من</TabsTrigger>
                <TabsTrigger value="analytics">آمار</TabsTrigger>
                <TabsTrigger value="history">تاریخچه مطالعه</TabsTrigger>
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
                          <div key={article.id} className={`flex items-center gap-4 p-2 rounded-lg hover:bg-muted transition-colors ${pinnedArticleId === article.id ? 'bg-primary/10' : ''}`}>
                            <div className="flex-grow">
                              <ArticleCard
                                id={article.id.toString()}
                                title={article.title}
                                excerpt={article.content.substring(0, 150) + "..."}
                                image={article.coverImageUrl}
                                author={{ name: user.name || "Unknown", avatar: user.avatarUrl }}
                                readTime={article.readTimeMinutes || 1}
                                publishDate={new Intl.DateTimeFormat("fa-IR").format(new Date(article.createdAt))}
                                claps={article._count.claps}
                                comments={article._count.comments}
                                category={article.categories[0]?.name || "عمومی"}
                              />
                            </div>
                            <div className="flex flex-col items-center gap-2">
                              <Button variant="ghost" size="sm" onClick={() => pinMutation.mutate(article.id)} disabled={pinMutation.isPending} className="h-8 w-8 p-0" title={pinnedArticleId === article.id ? "برداشتن از پین" : "پین کردن"}>
                                {pinnedArticleId === article.id ? <PinOff className="h-4 w-4 text-primary" /> : <Pin className="h-4 w-4 text-muted-foreground hover:text-primary" />}
                              </Button>
                              <ArticleStatusBadge status={article.status as ArticleStatus} />
                              <DeleteArticleButton articleId={article.id} />
                            </div>
                          </div>
                        ))
                      ) : (<p>شما هنوز مقاله‌ای ننوشته‌اید.</p>)}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics">
                <AnalyticsDashboard />
              </TabsContent>

              <TabsContent value="history">
                <Card className="shadow-soft border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><History className="h-5 w-5" />تاریخچه مطالعه</CardTitle>
                    <CardDescription>
                      آخرین مقالاتی که مطالعه کرده‌اید. نتایج را بر اساس بازه زمانی یا جست‌وجوی متن محدود کنید.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                      <Input
                        value={historySearch}
                        onChange={(event) => setHistorySearch(event.target.value)}
                        placeholder="جست‌وجو بر اساس عنوان یا محتوای مقاله"
                        className="md:max-w-sm"
                      />
                      <div className="flex items-center gap-2">
                        <Select value={historyRange} onValueChange={setHistoryRange}>
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="بازه" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="7d">۷ روز اخیر</SelectItem>
                            <SelectItem value="30d">۳۰ روز اخیر</SelectItem>
                            <SelectItem value="90d">۹۰ روز اخیر</SelectItem>
                            <SelectItem value="365d">۱ سال اخیر</SelectItem>
                            <SelectItem value="all">همه زمان‌ها</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          onClick={handleExportHistory}
                          disabled={isLoadingHistory || (historyArticles?.length ?? 0) === 0}
                        >
                          <Download className="ml-2 h-4 w-4" />
                          خروجی CSV
                        </Button>
                      </div>
                    </div>
                    {isLoadingHistory ? (
                      <div className="space-y-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div>
                    ) : isErrorHistory ? (
                      <p className="text-red-500 text-center">خطا در دریافت تاریخچه مطالعه.</p>
                    ) : historyArticles && historyArticles.length > 0 ? (
                      <div className="space-y-6">
                        {historyArticles.map(({ article, viewedAt }) => (
                          <div key={`${article.id}-${viewedAt}`} className="space-y-2">
                            {(() => {
                              const plainContent = article.content.replace(/<[^>]*>?/gm, "");
                              const preview = plainContent.substring(0, 150);
                              return (
                                <ArticleCard
                              id={article.id.toString()}
                              title={article.title}
                                  excerpt={
                                    preview + (plainContent.length > 150 ? "..." : "")
                                  }
                              image={article.coverImageUrl}
                              author={{
                                name: article.author.name || "ناشناس",
                                avatar: article.author.avatarUrl,
                              }}
                              readTime={article.readTimeMinutes || 1}
                              publishDate={new Intl.DateTimeFormat("fa-IR").format(
                                new Date(article.createdAt)
                              )}
                              claps={article._count.claps}
                              comments={article._count.comments}
                                  category={article.categories[0]?.name || "عمومی"}
                                />
                              );
                            })()}
                            <div className="flex justify-between text-xs text-muted-foreground px-2">
                              <span>
                                آخرین مطالعه: {new Intl.DateTimeFormat("fa-IR", {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                }).format(new Date(viewedAt))}
                              </span>
                              <span>بازه فعال: {currentRangeLabel}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (<p className="text-center text-muted-foreground py-8">تاریخچه مطالعه شما خالی است.</p>)}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="saved">
                <Card className="shadow-soft border-0">
                  <CardHeader><CardTitle>مقالات ذخیره شده</CardTitle></CardHeader>
                  <CardContent>
                    {isLoadingSaved ? (
                      <div className="space-y-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div>
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
                            author={{ name: article.author.name || "ناشناس", avatar: article.author.avatarUrl }}
                            readTime={article.readTimeMinutes || 1}
                            publishDate={new Intl.DateTimeFormat("fa-IR").format(new Date(article.createdAt))}
                            claps={article._count.claps}
                            comments={article._count.comments}
                            category={article.categories[0]?.name || "عمومی"}
                          />
                        ))}
                      </div>
                    ) : (<p>شما هنوز هیچ مقاله‌ای را ذخیره نکرده‌اید.</p>)}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="clapped">
                <Card className="shadow-soft border-0">
                  <CardHeader><CardTitle>مقالات تشویق شده</CardTitle></CardHeader>
                  <CardContent>
                    {isLoadingClapped ? (
                      <div className="space-y-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div>
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
                            author={{ name: article.author.name || "ناشناس", avatar: article.author.avatarUrl }}
                            readTime={article.readTimeMinutes || 1}
                            publishDate={new Intl.DateTimeFormat("fa-IR").format(new Date(article.createdAt))}
                            claps={article._count.claps}
                            comments={article._count.comments}
                            category={article.categories[0]?.name || "عمومی"}
                          />
                        ))}
                      </div>
                    ) : (<p>شما هنوز هیچ مقاله‌ای را تشویق نکرده‌اید.</p>)}
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