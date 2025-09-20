"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Categories = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    null
  );

  const categories = [
    {
      id: "technology",
      name: "فناوری",
      icon: Laptop,
      description: "آخرین اخبار و تحلیل‌های حوزه فناوری، هوش مصنوعی و نوآوری",
      articleCount: 156,
      color: "bg-blue-500",
      featured: true,
    },
    {
      id: "history",
      name: "تاریخ",
      icon: History,
      description: "کاوش در تاریخ ایران و جهان، تمدن‌ها و وقایع مهم تاریخی",
      articleCount: 89,
      color: "bg-amber-500",
      featured: true,
    },
    {
      id: "art",
      name: "هنر و معماری",
      icon: Palette,
      description: "هنر معاصر، معماری، طراحی و خلاقیت در ابعاد مختلف",
      articleCount: 67,
      color: "bg-purple-500",
      featured: false,
    },
    {
      id: "science",
      name: "علم",
      icon: FlaskConical,
      description: "پیشرفت‌های علمی، تحقیقات جدید و کشفیات علمی",
      articleCount: 98,
      color: "bg-green-500",
      featured: true,
    },
    {
      id: "culture",
      name: "فرهنگ",
      icon: Globe,
      description: "فرهنگ ایرانی و جهانی، آداب و رسوم، زندگی اجتماعی",
      articleCount: 124,
      color: "bg-rose-500",
      featured: false,
    },
    {
      id: "politics",
      name: "سیاست",
      icon: Building,
      description: "تحلیل‌های سیاسی، رویدادهای داخلی و بین‌المللی",
      articleCount: 78,
      color: "bg-red-500",
      featured: false,
    },
    {
      id: "economy",
      name: "اقتصاد",
      icon: DollarSign,
      description: "بازارهای مالی، اقتصاد ایران و جهان، استارتاپ‌ها",
      articleCount: 92,
      color: "bg-emerald-500",
      featured: true,
    },
    {
      id: "sports",
      name: "ورزش",
      icon: Dumbbell,
      description: "اخبار ورزشی، تحلیل بازی‌ها و قهرمانان ورزشی",
      articleCount: 45,
      color: "bg-orange-500",
      featured: false,
    },
    {
      id: "health",
      name: "سلامت",
      icon: Heart,
      description: "نکات سلامتی، پزشکی، تغذیه و سبک زندگی سالم",
      articleCount: 73,
      color: "bg-pink-500",
      featured: false,
    },
    {
      id: "environment",
      name: "محیط زیست",
      icon: Leaf,
      description: "محیط زیست، تغییرات اقلیمی و حفاظت از طبیعت",
      articleCount: 34,
      color: "bg-teal-500",
      featured: false,
    },
    {
      id: "literature",
      name: "ادبیات",
      icon: BookOpen,
      description: "شعر و ادب فارسی، نقد ادبی، کتاب‌خوانی",
      articleCount: 87,
      color: "bg-indigo-500",
      featured: false,
    },
    {
      id: "music",
      name: "موسیقی",
      icon: Music,
      description: "موسیقی کلاسیک و مدرن، آموزش و تحلیل موسیقی",
      articleCount: 29,
      color: "bg-violet-500",
      featured: false,
    },
  ];

  const featuredCategories = categories.filter((cat) => cat.featured);
  const allCategories = categories;

  return (
    <div className="min-h-screen bg-background">


      { }
      <section className="py-16 bg-journal-cream/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-journal mb-4">
              دسته‌بندی مقالات
            </h1>
            <p className="text-xl text-journal-light mb-8">
              موضوعات مختلف مجله روانیک را کاوش کنید
            </p>
          </div>
        </div>
      </section>

      { }
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-journal mb-8 text-center">
              دسته‌بندی‌های محبوب
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
              {featuredCategories.map((category) => (
                <Link
                  href={`/articles?category=${category.id}`}
                  key={category.id}
                >
                  <Card className="group hover:shadow-medium transition-all duration-300 border-0 shadow-soft h-full">
                    <CardContent className="p-6 text-center">
                      <div className="flex justify-center mb-4">
                        <div
                          className={`p-4 ${category.color} text-white rounded-xl`}
                        >
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
                        {category.articleCount} مقاله
                      </Badge>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      { }
      <section className="py-16 bg-journal-cream/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-journal mb-8 text-center">
              همه دسته‌بندی‌ها
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allCategories.map((category) => (
                <Link
                  href={`/articles?category=${category.id}`}
                  key={category.id}
                >
                  <Card className="group hover:shadow-medium transition-all duration-300 border-0 shadow-soft h-full">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div
                          className={`p-3 ${category.color} text-white rounded-lg flex-shrink-0`}
                        >
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
                              {category.articleCount} مقاله
                            </Badge>
                            {category.featured && (
                              <Badge
                                variant="outline"
                                className="border-journal-orange text-journal-orange text-xs"
                              >
                                محبوب
                              </Badge>
                            )}
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

      { }
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-journal mb-6">
              موضوع مورد علاقه خود را پیدا نکردید؟
            </h2>
            <p className="text-xl text-journal-light mb-8">
              پیشنهاد موضوع جدید دهید یا خودتان در آن حوزه مقاله بنویسید
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/write"> { }
                <Button
                  size="lg"
                  className="bg-journal-green text-white hover:bg-journal-green-light"
                >
                  نوشتن مقاله
                </Button>
              </Link>
              <Link href="/contact"> { }
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