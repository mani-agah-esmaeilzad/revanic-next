// src/app/categories/page.tsx
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { LucideIcon } from "lucide-react";
import { ensureDefaultCategories, resolveCategoryDefinition } from "@/lib/categories";
import type { Metadata } from "next";
import Script from "next/script";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { buildCanonical, getDeploymentUrl, itemListJsonLd } from "@/lib/seo";

const canonicalCategories = buildCanonical("/categories");

export const metadata: Metadata = {
  title: "دسته‌بندی‌های مقالات روانک",
  description: "تمام موضوعات فعال روانک را مرور کنید و به سرعت به مقالات مرتبط در هر زمینه دسترسی پیدا کنید.",
  ...(canonicalCategories ? { alternates: { canonical: canonicalCategories } } : {}),
  openGraph: {
    title: "دسته‌بندی‌های مقالات روانک",
    description: "از فناوری تا فرهنگ، موضوعات متنوع روانک را کاوش کنید.",
    url: canonicalCategories,
    locale: "fa_IR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "دسته‌بندی‌های روانک",
    description: "موضوع مورد علاقه خود را در روانک پیدا کنید.",
  },
};

type CategoryWithStats = {
  id: number;
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
  articleCount: number;
};

const Categories = async () => {
  await ensureDefaultCategories();

  const categoriesFromDb = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      articles: {
        where: { status: "APPROVED" },
        select: { id: true },
      },
    },
  });

  const categories: CategoryWithStats[] = categoriesFromDb.map((category) => {
    const { color, description, icon } = resolveCategoryDefinition(category.name);

    return {
      id: category.id,
      name: category.name,
      description,
      icon,
      color,
      articleCount: category.articles.length,
    };
  });

  const featuredCategories = [...categories]
    .sort((a, b) => b.articleCount - a.articleCount)
    .slice(0, 4);

  const deploymentUrl = getDeploymentUrl();
  const categoryJsonLd = deploymentUrl
    ? itemListJsonLd({
        url: `${deploymentUrl}/categories`,
        items: categories.map((category) => ({
          title: category.name,
          url: `${deploymentUrl}/articles?categoryId=${category.id}`,
          description: category.description,
        })),
      })
    : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-16 bg-journal-cream/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            {categoryJsonLd ? (
              <Script id="categories-itemlist" type="application/ld+json">
                {JSON.stringify(categoryJsonLd)}
              </Script>
            ) : null}
            <Breadcrumb className="mb-6">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">خانه</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>دسته‌بندی مقالات</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <h1 className="text-4xl font-bold text-journal mb-4">دسته‌بندی مقالات</h1>
            <p className="text-xl text-journal-light mb-8">
              موضوعات مختلف مجله روانک را با داده‌های زنده جست‌وجو کنید
            </p>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-journal mb-8 text-center">
              پربازدیدترین موضوعات این هفته
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
              {featuredCategories.map((category) => (
                <Link
                  href={`/articles?categoryId=${category.id}`}
                  key={category.id}
                >
                  <Card className="group hover:shadow-medium transition-all duration-300 border-0 shadow-soft h-full">
                    <CardContent className="p-6 text-center">
                      <div className="flex justify-center mb-4">
                        <div className={`p-4 ${category.color} text-white rounded-xl`}>
                          <category.icon className="h-8 w-8" />
                        </div>
                      </div>
                      <h3 className="font-bold text-lg text-journal group-hover:text-journal-green transition-colors mb-2">
                        {category.name}
                      </h3>
                      <p className="text-journal-light text-sm leading-relaxed mb-4 line-clamp-3">
                        {category.description}
                      </p>
                      <Badge
                        variant="secondary"
                        className="bg-journal-cream text-journal-green"
                      >
                        {category.articleCount.toLocaleString("fa-IR")} مقاله
                      </Badge>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* All Categories */}
      <section className="py-16 bg-journal-cream/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-journal mb-8 text-center">
              همه موضوعات موجود
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => (
                <Link
                  href={`/articles?categoryId=${category.id}`}
                  key={category.id}
                >
                  <Card className="group hover:shadow-medium transition-all duration-300 border-0 shadow-soft h-full">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 ${category.color} text-white rounded-lg flex-shrink-0`}>
                          <category.icon className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-journal group-hover:text-journal-green transition-colors mb-2">
                            {category.name}
                          </h3>
                          <p className="text-journal-light text-sm leading-relaxed mb-3 line-clamp-2">
                            {category.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <Badge
                              variant="secondary"
                              className="bg-journal-cream text-journal-green text-xs"
                            >
                              {category.articleCount.toLocaleString("fa-IR")} مقاله
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-journal mb-6">
              موضوع تازه‌ای مدنظر دارید؟
            </h2>
            <p className="text-xl text-journal-light mb-8">
              به جمع نویسندگان بپیوندید یا پیشنهاد خود را برای ایجاد دسته‌بندی جدید ثبت کنید.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/write">
                <Button
                  size="lg"
                  className="bg-journal-green text-white hover:bg-journal-green-light"
                >
                  نوشتن مقاله
                </Button>
              </Link>
              <Link href="/contact">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-journal-green text-journal-green hover:bg-journal-green hover:text-white"
                >
                  پیشنهاد موضوع
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Categories;
