// src/app/subscription/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Check, Star, GraduationCap, Gift, Loader2, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge"; // <-- Missing import added
import { Label } from "@/components/ui/label";   // <-- Missing import added

type PlanTier = 'TRIAL' | 'MONTHLY' | 'YEARLY' | 'STUDENT';

const Subscription = () => {
  const [isLoading, setIsLoading] = useState<PlanTier | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [studentFile, setStudentFile] = useState<File | null>(null);
  const router = useRouter();

  const handleSubscribe = async (tier: PlanTier) => {
    if (tier === 'STUDENT' && !studentFile) {
        setMessage("لطفاً ابتدا کارت دانشجویی خود را آپلود کنید.");
        return;
    }

    setIsLoading(tier);
    setMessage(null);

    // TODO: Implement student card upload logic
    if (tier === 'STUDENT') {
        alert("قابلیت آپلود فایل هنوز پیاده‌سازی نشده است. در این نسخه، اشتراک دانشجویی به صورت آزمایشی برای شما فعال می‌شود.");
    }

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });

      if (response.ok) {
        setMessage(`اشتراک شما با موفقیت فعال شد!`);
        setTimeout(() => router.push('/profile'), 2000);
      } else if (response.status === 401) {
        router.push("/login");
      } else {
        const errorData = await response.text();
        setMessage(errorData || "خطایی در فعال‌سازی اشتراک رخ داد.");
      }
    } catch (error) {
      setMessage("خطای شبکه. لطفاً دوباره تلاش کنید.");
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <section className="py-16 bg-journal-cream/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-journal mb-4">
              پلن اشتراک خود را انتخاب کنید
            </h1>
            <p className="text-xl text-journal-light mb-8">
              با عضویت ویژه، به تمام مقالات دسترسی نامحدود داشته باشید و از نویسندگان حمایت کنید.
            </p>
            {message && (
              <div
                className={`p-4 mb-4 text-center rounded-lg ${message.includes("موفقیت") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
              >
                {message}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            
            {/* Free Trial Plan */}
            <Card className="flex flex-col">
              <CardHeader className="text-center">
                <Gift className="h-10 w-10 mx-auto text-journal-orange mb-4"/>
                <CardTitle className="text-2xl font-bold text-journal">آزمایشی رایگان</CardTitle>
                <CardDescription>7 روز دسترسی کامل</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col flex-grow">
                <ul className="space-y-3 mb-6 text-sm text-journal-light flex-grow">
                  <li className="flex items-center"><Check className="h-4 w-4 ml-2 text-green-500"/>دسترسی به تمام مقالات</li>
                  <li className="flex items-center"><Check className="h-4 w-4 ml-2 text-green-500"/>امکان نظردهی و لایک</li>
                </ul>
                <Button onClick={() => handleSubscribe('TRIAL')} disabled={!!isLoading} className="w-full mt-auto bg-journal-orange hover:bg-journal-orange/90">
                  {isLoading === 'TRIAL' ? <Loader2 className="animate-spin" /> : 'شروع دوره ۷ روزه'}
                </Button>
              </CardContent>
            </Card>

            {/* Monthly Plan */}
            <Card className="flex flex-col">
              <CardHeader className="text-center">
                <Star className="h-10 w-10 mx-auto text-journal-green mb-4"/>
                <CardTitle className="text-2xl font-bold text-journal">اشتراک ماهانه</CardTitle>
                <CardDescription>۲۰۰,۰۰۰ تومان / ماه</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col flex-grow">
                <ul className="space-y-3 mb-6 text-sm text-journal-light flex-grow">
                  <li className="flex items-center"><Check className="h-4 w-4 ml-2 text-green-500"/>تمام ویژگی‌های پلن آزمایشی</li>
                  <li className="flex items-center"><Check className="h-4 w-4 ml-2 text-green-500"/>حمایت مستقیم از نویسندگان</li>
                  <li className="flex items-center"><Check className="h-4 w-4 ml-2 text-green-500"/>بوکمارک کردن نامحدود</li>
                  <li className="flex items-center"><Check className="h-4 w-4 ml-2 text-green-500"/>تجربه بدون تبلیغات</li>
                </ul>
                <Button onClick={() => handleSubscribe('MONTHLY')} disabled={!!isLoading} className="w-full mt-auto bg-journal-green hover:bg-journal-green/90">
                  {isLoading === 'MONTHLY' ? <Loader2 className="animate-spin" /> : 'انتخاب پلن ماهانه'}
                </Button>
              </CardContent>
            </Card>

            {/* Yearly Plan */}
            <Card className="ring-2 ring-journal-orange shadow-lg flex flex-col relative">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-journal-orange">۲ ماه رایگان</Badge>
              <CardHeader className="text-center">
                <Star className="h-10 w-10 mx-auto text-journal-orange mb-4"/>
                <CardTitle className="text-2xl font-bold text-journal">اشتراک سالانه</CardTitle>
                <CardDescription>۲,۰۰۰,۰۰۰ تومان / سال</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col flex-grow">
                 <ul className="space-y-3 mb-6 text-sm text-journal-light flex-grow">
                  <li className="flex items-center"><Check className="h-4 w-4 ml-2 text-green-500"/>تمام ویژگی‌های پلن ماهانه</li>
                  <li className="flex items-center font-bold text-journal"><Check className="h-4 w-4 ml-2 text-green-500"/>تخفیف ویژه سالانه</li>
                </ul>
                <Button onClick={() => handleSubscribe('YEARLY')} disabled={!!isLoading} className="w-full mt-auto bg-journal-orange hover:bg-journal-orange/90">
                  {isLoading === 'YEARLY' ? <Loader2 className="animate-spin" /> : 'انتخاب پلن سالانه'}
                </Button>
              </CardContent>
            </Card>

             {/* Student Plan */}
            <Card className="flex flex-col">
              <CardHeader className="text-center">
                <GraduationCap className="h-10 w-10 mx-auto text-journal-green mb-4"/>
                <CardTitle className="text-2xl font-bold text-journal">پلن دانشجویی</CardTitle>
                <CardDescription>رایگان با ارائه کارت</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col flex-grow">
                 <ul className="space-y-3 mb-6 text-sm text-journal-light flex-grow">
                  <li className="flex items-center"><Check className="h-4 w-4 ml-2 text-green-500"/>تمام ویژگی‌های پلن ماهانه</li>
                  <li className="flex items-center"><Check className="h-4 w-4 ml-2 text-green-500"/>ویژه دانشجویان عزیز</li>
                </ul>
                <div className="space-y-3 mt-auto">
                    <Label htmlFor="student-card" className="cursor-pointer inline-flex items-center justify-center w-full border-2 border-dashed rounded-lg p-2 text-center hover:bg-gray-50">
                        <Upload className="h-4 w-4 ml-2"/>
                        {studentFile ? studentFile.name : 'آپلود کارت دانشجویی'}
                    </Label>
                    <Input id="student-card" type="file" className="hidden" onChange={(e) => setStudentFile(e.target.files ? e.target.files[0] : null)} accept="image/*,.pdf"/>
                    <Button onClick={() => handleSubscribe('STUDENT')} disabled={!!isLoading || !studentFile} className="w-full bg-journal-green hover:bg-journal-green/90">
                        {isLoading === 'STUDENT' ? <Loader2 className="animate-spin" /> : 'ثبت اشتراک دانشجویی'}
                    </Button>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </section>

      {/* Financial Aid Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
            <Card className="max-w-3xl mx-auto bg-journal-cream/50 border-journal-green/20">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl text-journal">یه سوال بامزه!</CardTitle>
                    <CardDescription className="text-journal-light">
                        اگه گفتی بهترین دوست یک نویسنده چیه؟ ... سکوت و یک فنجان چای داغ!
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                    <p className="text-journal-light mb-4">
                        ما در روانیک معتقدیم که دانش باید برای همه در دسترس باشه. اگر توانایی مالی برای تهیه اشتراک رو نداری، هیچ اشکالی نداره. کافیه به آیدی تلگرام ما یک پیام بدی و ما یک اکانت رایگان برات فعال می‌کنیم.
                    </p>
                    <Button variant="link" asChild>
                        <a href="https://t.me/RevanicSupport" target="_blank" rel="noopener noreferrer" className="text-lg text-journal-orange">
                            ارسال پیام به تلگرام: @RevanicSupport
                        </a>
                    </Button>
                </CardContent>
            </Card>
        </div>
      </section>
    </div>
  );
};

export default Subscription;