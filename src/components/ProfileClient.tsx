"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Edit3,
  Heart,
  Bookmark,
  PenTool,
  Settings,
  Crown,
  LogOut,
} from "lucide-react";
import ArticleCard from "@/components/ArticleCard";
import { useRouter } from "next/navigation";
import { ProfileSettings } from "./ProfileSettings";
import { DeleteArticleButton } from "./DeleteArticleButton"; // Import the new component

// Define types for the props
interface Article {
  id: number;
  title: string;
  content: string;
  createdAt: Date;
}

interface UserData {
  id: number;
  name: string | null;
  email: string;
  bio: string | null; // Add bio field
  articles: Article[];
  createdAt: Date;
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

export const ProfileClient = ({ user }: ProfileClientProps) => {
  const joinDate = new Intl.DateTimeFormat("fa-IR").format(user.createdAt);

  // Mock data for parts not yet implemented
  const savedArticles = [
    {
      id: "2",
      title: "مدیریت استرس در محیط کار",
      excerpt:
        "استرس شغلی یکی از چالش‌های اصلی دنیای مدرن است. در این مقاله روش‌های عملی برای مدیریت استرس کاری بررسی می‌شود.",
      author: { name: "دکتر علی رضایی", avatar: "" },
      readTime: 6,
      publishDate: "۱۴۰۳/۰۹/۰۸",
      likes: 89,
      comments: 12,
      category: "مدیریت استرس",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Profile Header */}
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
                        <h1 className="text-3xl font-bold text-journal mb-2">
                          {user.name}
                        </h1>
                        <p className="text-journal-light mb-2">{user.email}</p>
                        <div className="flex items-center gap-2 mb-4">
                          <Badge
                            variant="secondary"
                            className="flex items-center gap-1"
                          >
                            <Crown className="h-3 w-3" />
                            اشتراک رایگان
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
                        <div className="text-2xl font-bold text-journal">
                          {user.articles.length}
                        </div>
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

            {/* Tabs */}
            <Tabs defaultValue="articles" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-8">
                <TabsTrigger value="articles">مقالات من</TabsTrigger>
                <TabsTrigger value="saved">ذخیره شده</TabsTrigger>
                <TabsTrigger value="liked">پسندیده</TabsTrigger>
                <TabsTrigger value="settings">تنظیمات</TabsTrigger>
              </TabsList>

              <TabsContent value="articles">
                <Card className="shadow-soft border-0">
                  <CardHeader>
                    <CardTitle>مقالات منتشر شده</CardTitle>
                  </CardHeader>
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
                                excerpt={article.content.substring(0, 150)}
                                author={{
                                  name: user.name || "Unknown",
                                  avatar: "",
                                }}
                                readTime={Math.ceil(
                                  article.content.length / 1000,
                                )}
                                publishDate={new Intl.DateTimeFormat(
                                  "fa-IR",
                                ).format(article.createdAt)}
                                likes={0}
                                comments={0}
                                category={"عمومی"}
                              />
                            </div>
                            <div className="flex flex-col gap-2">
                              <DeleteArticleButton articleId={article.id} />
                            </div>
                          </div>
                        ))
                      ) : (
                        <p>شما هنوز مقاله‌ای منتشر نکرده‌اید.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="saved">
                <Card className="shadow-soft border-0">
                  <CardHeader>
                    <CardTitle>مقالات ذخیره شده</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>این قابلیت هنوز پیاده‌سازی نشده است.</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="liked">
                <Card className="shadow-soft border-0">
                  <CardHeader>
                    <CardTitle>مقالات پسندیده</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>این قابلیت هنوز پیاده‌سازی نشده است.</p>
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
