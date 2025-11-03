import { subDays, format } from "date-fns";
import { faIR } from "date-fns/locale";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const InsightsPage = async () => {
  const now = new Date();
  const thirtyDaysAgo = subDays(now, 30);
  const sixtyDaysAgo = subDays(now, 60);
  const ninetyDaysAgo = subDays(now, 90);

  const [
    totalArticles,
    totalAuthors,
    monthlyArticles,
    previousMonthArticles,
    monthlyViews,
    newAuthors,
    returningAuthors,
    categorySnapshot,
  ] = await Promise.all([
    prisma.article.count({ where: { status: "APPROVED" } }),
    prisma.user.count({ where: { articles: { some: { status: "APPROVED" } } } }),
    prisma.article.count({
      where: {
        status: "APPROVED",
        createdAt: { gte: thirtyDaysAgo },
      },
    }),
    prisma.article.count({
      where: {
        status: "APPROVED",
        createdAt: {
          gte: sixtyDaysAgo,
          lt: thirtyDaysAgo,
        },
      },
    }),
    prisma.articleView.count({ where: { viewedAt: { gte: thirtyDaysAgo } } }),
    prisma.user.count({
      where: {
        articles: {
          some: {
            status: "APPROVED",
            createdAt: { gte: thirtyDaysAgo },
          },
        },
      },
    }),
    prisma.user.count({
      where: {
        articles: {
          some: {
            status: "APPROVED",
            createdAt: { gte: ninetyDaysAgo },
          },
        },
      },
    }),
    prisma.category.findMany({
      include: {
        articles: {
          where: {
            status: "APPROVED",
            createdAt: { gte: ninetyDaysAgo },
          },
          select: { id: true, createdAt: true },
        },
      },
    }),
  ]);

  const growthRate = previousMonthArticles === 0
    ? 100
    : Math.round(((monthlyArticles - previousMonthArticles) / previousMonthArticles) * 100);

  const averageReadsPerArticle = monthlyArticles === 0 ? 0 : Math.round(monthlyViews / monthlyArticles);
  const retentionRate = returningAuthors === 0 ? 0 : Math.round((monthlyArticles / returningAuthors) * 10);

  const topCategories = categorySnapshot
    .map((category) => ({
      id: category.id,
      name: category.name,
      articleCount: category.articles.length,
      latestPublishDate: category.articles
        .map((article) => article.createdAt)
        .sort((a, b) => b.getTime() - a.getTime())[0],
    }))
    .filter((category) => category.articleCount > 0)
    .sort((a, b) => b.articleCount - a.articleCount)
    .slice(0, 4);

  const busiestCategory = topCategories[0];

  return (
    <div className="min-h-screen bg-background">
      <section className="py-16 bg-gradient-to-br from-journal-cream via-background to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <Badge className="bg-journal-green text-white px-4 py-1 rounded-full text-sm">
              گزارش رشد جامعه
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-journal leading-tight">
              تصویر ماهانه فعالیت نویسندگان و خوانندگان روانک
            </h1>
            <p className="text-lg text-journal-light leading-relaxed">
              این گزارش خلاصه‌ای از مشارکت نویسندگان، روند انتشار مقالات و رفتار مطالعه کاربران در سی روز گذشته است.
              از آن برای برنامه‌ریزی تقویم محتوا و اطلاع‌رسانی به تیم خود استفاده کنید.
            </p>
            <Link href="/editorial-guide">
              <Button size="lg" className="bg-journal-green hover:bg-journal text-white">
                رفتن به راهنمای سردبیری
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-0 shadow-soft">
            <CardHeader>
              <CardTitle className="text-sm text-journal-light">کل مقالات تایید شده</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-bold text-journal">
              {totalArticles.toLocaleString("fa-IR")}
            </CardContent>
          </Card>
          <Card className="border-0 shadow-soft">
            <CardHeader>
              <CardTitle className="text-sm text-journal-light">نویسندگان فعال</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-bold text-journal">
              {totalAuthors.toLocaleString("fa-IR")}
            </CardContent>
          </Card>
          <Card className="border-0 shadow-soft">
            <CardHeader>
              <CardTitle className="text-sm text-journal-light">مقالات این ماه</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-bold text-journal">
              {monthlyArticles.toLocaleString("fa-IR")}
            </CardContent>
          </Card>
          <Card className="border-0 shadow-soft">
            <CardHeader>
              <CardTitle className="text-sm text-journal-light">بازدید سی روز اخیر</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-bold text-journal">
              {monthlyViews.toLocaleString("fa-IR")}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="pb-16">
        <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="border-0 shadow-soft lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                روند انتشار ماه جاری
                <span className={`text-sm ${growthRate >= 0 ? "text-journal-green" : "text-red-500"}`}>
                  {growthRate >= 0 ? "+" : ""}
                  {growthRate.toLocaleString("fa-IR")}٪ نسبت به ماه قبل
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm text-journal-light">
                  <span>هدف ماهانه: ۳۰ مقاله</span>
                  <span>{monthlyArticles.toLocaleString("fa-IR")} منتشر شده</span>
                </div>
                <Progress value={Math.min(100, (monthlyArticles / 30) * 100)} className="h-2" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-journal">
                <div className="p-4 bg-journal-cream/50 rounded-xl">
                  <p className="text-journal-light">نویسندگان تازه</p>
                  <p className="text-2xl font-semibold text-journal">{newAuthors.toLocaleString("fa-IR")}</p>
                  <p className="text-xs text-journal-light">در سی روز اخیر نخستین مقاله خود را منتشر کرده‌اند.</p>
                </div>
                <div className="p-4 bg-journal-cream/50 rounded-xl">
                  <p className="text-journal-light">میانگین بازدید هر مقاله</p>
                  <p className="text-2xl font-semibold text-journal">{averageReadsPerArticle.toLocaleString("fa-IR")}</p>
                  <p className="text-xs text-journal-light">جمع بازدید تقسیم بر تعداد مقالات ماه.</p>
                </div>
                <div className="p-4 bg-journal-cream/50 rounded-xl">
                  <p className="text-journal-light">شاخص مشارکت در تیم‌ها</p>
                  <p className="text-2xl font-semibold text-journal">{retentionRate.toLocaleString("fa-IR")}</p>
                  <p className="text-xs text-journal-light">بر اساس نسبت انتشار به نویسندگان فعال ۹۰ روز اخیر.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-soft">
            <CardHeader>
              <CardTitle>خلاصه داستانی این ماه</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed text-journal">
              <p>
                در سی روز گذشته {monthlyArticles.toLocaleString("fa-IR")} مقاله منتشر شده و مجموع بازدیدها به
                {" "}
                {monthlyViews.toLocaleString("fa-IR")} رسید. {newAuthors.toLocaleString("fa-IR")}{" "}
                نویسنده تازه قلم برداشته‌اند و جامعه در مجموع {totalAuthors.toLocaleString("fa-IR")} نفر نویسنده فعال دارد.
              </p>
              {busiestCategory ? (
                <p>
                  پرکارترین دستهٔ محتوایی «{busiestCategory.name}» بود که {busiestCategory.articleCount.toLocaleString("fa-IR")}
                  {" "}
                  مقاله در آن منتشر شد و آخرین آن در تاریخ
                  {" "}
                  {format(busiestCategory.latestPublishDate ?? now, "dd MMMM", { locale: faIR })} منتشر شده است.
                </p>
              ) : (
                <p>برای دسته‌بندی‌ها هنوز داده‌ای ثبت نشده است. با انتشار مقالات تازه این بخش فعال می‌شود.</p>
              )}
              <p>
                برای هماهنگی بهتر با تیم، به تقویم سردبیری مراجعه کنید و در صورت نیاز با پشتیبانی تماس بگیرید تا
                داستان‌های موفقیت بعدی را رقم بزنیم.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="pb-20">
        <div className="container mx-auto px-4 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-journal">پربازدیدترین دسته‌ها در ۹۰ روز اخیر</h2>
            <Link href="/categories" className="text-sm text-journal-green hover:underline">
              مشاهده همه دسته‌ها
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {topCategories.length > 0 ? (
              topCategories.map((category) => (
                <Card key={category.id} className="border-0 shadow-soft">
                  <CardContent className="p-6 space-y-2 text-journal">
                    <h3 className="text-lg font-semibold">{category.name}</h3>
                    <p className="text-sm text-journal-light">
                      {category.articleCount.toLocaleString("fa-IR")} مقاله در سه ماه اخیر
                    </p>
                    {category.latestPublishDate ? (
                      <p className="text-xs text-journal-light">
                        آخرین انتشار {format(category.latestPublishDate, "dd MMMM", { locale: faIR })}
                      </p>
                    ) : null}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="border-0 shadow-soft">
                <CardContent className="p-6 text-center text-journal-light">
                  هنوز داده‌ای برای نمایش وجود ندارد.
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default InsightsPage;
