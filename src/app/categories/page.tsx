// src/app/categories/page.tsx
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Laptop,
  History,
  Palette,
  FlaskConical,
  Globe,
  Building,
  DollarSign,
  Dumbbell,
  Heart,
  Leaf,
  BookOpen,
  Music,
  LucideIcon,
} from "lucide-react";

type CategoryWithStats = {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: LucideIcon;
  color: string;
  articleCount: number;
};

const CATEGORY_METADATA: Record<string, { icon: LucideIcon; color: string; description: string }> = {
  technology: {
    icon: Laptop,
    color: "bg-blue-500",
    description: "آخرین نوآوری‌ها، هوش مصنوعی و آینده دنیای دیجیتال",
  },
  history: {
    icon: History,
    color: "bg-amber-500",
    description: "سفر به گذشته و روایت تمدن‌های تاثیرگذار جهان",
  },
  art: {
    icon: Palette,
    color: "bg-purple-500",
    description: "معماری، طراحی و الهامات خلاقانه هنرمندان",
  },
  science: {
    icon: FlaskConical,
    color: "bg-green-500",
    description: "کشفیات تازه و تحلیل یافته‌های علمی",
  },
  culture: {
    icon: Globe,
    color: "bg-rose-500",
    description: "جامعه، سبک زندگی و روایت‌های فرهنگی",
  },
  politics: {
    icon: Building,
    color: "bg-red-500",
    description: "تحولات سیاسی ایران و جهان با نگاه تحلیلی",
  },
  economy: {
    icon: DollarSign,
    color: "bg-emerald-500",
    description: "کسب‌وکارها، بازار سرمایه و اقتصاد هوشمند",
  },
  sports: {
    icon: Dumbbell,
    color: "bg-orange-500",
    description: "اخبار، تحلیل مسابقات و پشت‌صحنه قهرمانان",
  },
  health: {
    icon: Heart,
    color: "bg-pink-500",
    description: "پزشکی، تندرستی و سبک زندگی سالم",
  },
  environment: {
    icon: Leaf,
    color: "bg-teal-500",
    description: "طبیعت، تغییرات اقلیمی و پایداری زیست‌بوم",
  },
  literature: {
    icon: BookOpen,
    color: "bg-indigo-500",
    description: "کتاب‌ها، نقد ادبی و دنیای واژگان فارسی",
  },
  music: {
    icon: Music,
    color: "bg-violet-500",
    description: "آهنگسازان، آلبوم‌های تازه و تحلیل سبک‌ها",
  },
};

const FALLBACK_COLOR = "bg-slate-500";

const createSlug = (name: string) =>
  name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\u0600-\u06FF\w-]+/g, "");

const getCategoryMetadata = (slug: string, name: string) => {
  const fallbackDescription = `جدیدترین مقالات مرتبط با ${name}`;
  const metadata = CATEGORY_METADATA[slug];

  if (!metadata) {
    return {
      description: fallbackDescription,
      icon: BookOpen,
      color: FALLBACK_COLOR,
    };
  }

  return {
    description: metadata.description,
    icon: metadata.icon,
    color: metadata.color,
  };
};

const Categories = async () => {
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
    const slug = createSlug(category.name);
    const { color, description, icon } = getCategoryMetadata(slug, category.name);

    return {
      id: category.id,
      name: category.name,
      slug,
      description,
      icon,
      color,
      articleCount: category.articles.length,
    };
  });

  const featuredCategories = [...categories]
    .sort((a, b) => b.articleCount - a.articleCount)
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-16 bg-journal-cream/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-journal mb-4">دسته‌بندی مقالات</h1>
            <p className="text-xl text-journal-light mb-8">
              موضوعات مختلف مجله روانیک را با داده‌های زنده جست‌وجو کنید
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
