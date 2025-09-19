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
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8">
              <Logo size="xl" className="justify-center mb-6" />
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-journal mb-6 leading-tight">
              جایی برای اشتراک
              <br />
              <span className="text-journal-orange">دانش و تجربه</span>
            </h1>
            
            <p className="text-xl text-journal-light mb-8 max-w-2xl mx-auto leading-relaxed">
              در مجله روانیک، نویسندگان و خوانندگان فارسی‌زبان دور هم جمع می‌شوند تا 
              بهترین مقالات را بخوانند، بنویسند و به اشتراک بگذارند.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
      <section className="py-16 bg-journal-cream/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
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
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-journal mb-4">مقالات برگزیده</h2>
            <p className="text-journal-light max-w-2xl mx-auto">
              بهترین مقالات هفته که توسط جامعه خوانندگان ما انتخاب شده‌اند
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto space-y-6">
            {featuredArticles.map((article) => (
              <ArticleCard key={article.id} {...article} />
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link href="/articles">
              <Button variant="outline" size="lg">
                مشاهده همه مقالات
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-hero">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto text-white">
            <h2 className="text-3xl font-bold mb-6">
              آماده‌اید داستان خود را بگویید؟
            </h2>
            <p className="text-xl mb-2 opacity-90">
              به جامعه نویسندگان و خوانندگان فارسی‌زبان بپیوندید و صدای خود را به گوش جهان برسانید
            </p>
          </div>
        </div>
      </section>
    </>
  );
};

export default Index;
