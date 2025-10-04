// src/app/page.tsx
import { Button } from "@/components/ui/button";
import { PenTool, BookOpen, Users } from "lucide-react";
import Link from "next/link";
import ArticleCard from "@/components/ArticleCard";
import Logo from "@/components/Logo";

const Index = () => {
  // Sample articles data
  const featuredArticles = [
    {
      id: "1",
      title: "هوش مصنوعی و آینده‌ای که در انتظار ماست",
      excerpt: "بررسی تأثیرات هوش مصنوعی بر جامعه، اقتصاد و زندگی روزمره انسان‌ها. چگونه این فناوری جهان را تغییر خواهد داد؟",
      author: { name: "علی رضایی", avatar: "" },
      readTime: 8,
      publishDate: "۳ روز پیش",
      claps: 124, // <-- تغییر از likes به claps
      comments: 23,
      category: "فناوری",
      image: ""
    },
    {
      id: "2",
      title: "سفری به دل تاریخ ایران باستان",
      excerpt: "کاوش در اعماق تمدن ایرانی و بررسی دستاوردهای باستانیان که هنوز در زندگی امروز ما تأثیرگذار هستند.",
      author: { name: "مریم احمدی", avatar: "" },
      readTime: 12,
      publishDate: "یک هفته پیش",
      claps: 89, // <-- تغییر از likes به claps
      comments: 15,
      category: "تاریخ",
      image: ""
    },
    {
      id: "3",
      title: "روان‌شناسی رنگ‌ها در معماری مدرن",
      excerpt: "تأثیر رنگ‌ها بر روحیه انسان و چگونگی استفاده از این دانش در طراحی فضاهای زندگی و کار.",
      author: { name: "محمد حسینی", avatar: "" },
      readTime: 6,
      publishDate: "۲ هفته پیش",
      claps: 67, // <-- تغییر از likes به claps
      comments: 8,
      category: "هنر و معماری",
      image: ""
    }
  ];

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-bl from-journal-cream via-background to-journal-cream/50">
        <div className="container mx-auto px-4 py-16 sm:py-20">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-8">
              <Logo size="xl" className="justify-center mb-6" />
            </div>

            <h1 className="mb-6 text-3xl font-bold leading-tight text-journal sm:text-5xl md:text-6xl">
              جایی برای اشتراک
              <br />
              <span className="text-journal-orange">دانش و تجربه</span>
            </h1>

            <p className="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-journal-light sm:text-xl">
              در مجله روانیک، نویسندگان و خوانندگان فارسی‌زبان دور هم جمع می‌شوند تا
              بهترین مقالات را بخوانند، بنویسند و به اشتراک بگذارند.
            </p>

            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/articles">
                <Button size="lg" className="w-full sm:w-auto gradient-hero text-white hover:shadow-medium transition-all">
                  <BookOpen className="ml-2 h-5 w-5" />
                  شروع خواندن
                </Button>
              </Link>

              <Link href="/write">
                <Button variant="outline" size="lg" className="w-full sm:w-auto border-journal-green text-journal-green hover:bg-journal-green hover:text-white">
                  <PenTool className="ml-2 h-5 w-5" />
                  شروع نوشتن
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-journal-cream/30 py-12 sm:py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 text-center sm:grid-cols-3">
            <div className="text-center">
              <div className="text-3xl font-bold text-journal-green mb-2">۱۲۰۰+</div>
              <p className="text-journal-light">مقاله منتشر شده</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-journal-green mb-2">۳۵۰+</div>
              <p className="text-journal-light">نویسنده فعال</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-journal-green mb-2">۸۵۰۰+</div>
              <p className="text-journal-light">خواننده روزانه</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Articles */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4">
          <div className="mb-10 text-center sm:mb-12">
            <h2 className="mb-4 text-2xl font-bold text-journal sm:text-3xl">مقالات برگزیده</h2>
            <p className="mx-auto max-w-2xl text-sm text-journal-light sm:text-base">
              بهترین مقالات هفته که توسط جامعه خوانندگان ما انتخاب شده‌اند
            </p>
          </div>

          <div className="mx-auto max-w-4xl space-y-6">
            {featuredArticles.map((article) => (
              <ArticleCard
                key={article.id}
                id={article.id}
                title={article.title}
                excerpt={article.excerpt}
                author={article.author}
                readTime={article.readTime}
                publishDate={article.publishDate}
                claps={article.claps}
                comments={article.comments}
                category={article.category}
                image={article.image}
              />
            ))}
          </div>

          <div className="mt-10 text-center sm:mt-12">
            <Link href="/articles">
              <Button variant="outline" size="lg">
                مشاهده همه مقالات
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-hero py-16 sm:py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="mx-auto max-w-3xl text-white">
            <h2 className="mb-4 text-2xl font-bold text-journal sm:mb-6 sm:text-3xl">
              آماده‌اید داستان خود را بگویید؟
            </h2>
            <p className="mb-8 text-base opacity-90 text-journal sm:text-xl">
              به جامعه نویسندگان و خوانندگان فارسی‌زبان بپیوندید و صدای خود را به گوش جهان برسانید
            </p>
            <Link href="/register">
              <Button size="lg" variant="secondary" className="bg-white text-journal-green hover:bg-journal-cream">
                <Users className="ml-2 h-5 w-5" />
                عضویت رایگان
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default Index;
