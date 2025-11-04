"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Star, GraduationCap, Gift, Loader2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

type PlanTier = "TRIAL" | "MONTHLY" | "YEARLY" | "STUDENT";

export const SubscriptionPageClient = () => {
  const [isLoading, setIsLoading] = useState<PlanTier | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [studentFile, setStudentFile] = useState<File | null>(null);
  const router = useRouter();

  const handleSubscribe = async (tier: PlanTier) => {
    setIsLoading(tier);
    setMessage(null);
    let studentIdCardUrl: string | undefined;

    if (tier === "STUDENT") {
      if (!studentFile) {
        setMessage("لطفاً ابتدا کارت دانشجویی خود را آپلود کنید.");
        setIsLoading(null);
        return;
      }

      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", studentFile);

      try {
        const uploadResponse = await fetch("/api/upload", { method: "POST", body: formData });
        if (!uploadResponse.ok) throw new Error("Upload failed");
        const uploadData = await uploadResponse.json();
        studentIdCardUrl = `${window.location.origin}${uploadData.url}`;
      } catch (error) {
        console.error(error);
        setMessage("خطا در آپلود فایل. لطفاً دوباره تلاش کنید.");
        setIsLoading(null);
        setIsUploading(false);
        return;
      } finally {
        setIsUploading(false);
      }
    }

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, studentIdCardUrl }),
      });

      if (response.ok) {
        if (tier === "STUDENT") {
          setMessage("درخواست شما ثبت شد و پس از بررسی نتیجه اعلام خواهد شد.");
        } else {
          setMessage("اشتراک شما با موفقیت فعال شد!");
        }
        setTimeout(() => router.push("/profile"), 3000);
      } else if (response.status === 401) {
        router.push("/login");
      } else {
        const errorData = await response.text();
        setMessage(errorData || "خطایی در فعال‌سازی اشتراک رخ داد.");
      }
    } catch {
      setMessage("خطای شبکه. لطفاً دوباره تلاش کنید.");
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-journal-cream/30 py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="mb-4 text-4xl font-bold text-journal">پلن اشتراک خود را انتخاب کنید</h1>
            <p className="mb-8 text-xl text-journal-light">
              با عضویت ویژه، به تمام مقالات دسترسی نامحدود داشته باشید و از نویسندگان حمایت کنید.
            </p>
            {message ? (
              <div
                className={`mb-4 rounded-lg p-4 text-center ${
                  message.includes("موفقیت") || message.includes("ثبت شد")
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {message}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            <Card className="flex flex-col">
              <CardHeader className="text-center">
                <Gift className="mx-auto mb-4 h-10 w-10 text-journal-orange" />
                <CardTitle className="text-2xl font-bold text-journal">آزمایشی رایگان</CardTitle>
                <CardDescription>۷ روز دسترسی کامل</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <ul className="mb-6 flex-grow space-y-3 text-sm text-journal-light">
                  <li className="flex items-center">
                    <Check className="ml-2 h-4 w-4 text-green-500" />
                    دسترسی به تمام مقالات
                  </li>
                  <li className="flex items-center">
                    <Check className="ml-2 h-4 w-4 text-green-500" />
                    امکان نظردهی و لایک
                  </li>
                </ul>
                <Button
                  onClick={() => handleSubscribe("TRIAL")}
                  disabled={!!isLoading}
                  className="mt-auto w-full bg-journal-orange hover:bg-journal-orange/90"
                >
                  {isLoading === "TRIAL" ? <Loader2 className="animate-spin" /> : "شروع دوره ۷ روزه"}
                </Button>
              </CardContent>
            </Card>

            <Card className="flex flex-col">
              <CardHeader className="text-center">
                <Star className="mx-auto mb-4 h-10 w-10 text-journal-green" />
                <CardTitle className="text-2xl font-bold text-journal">اشتراک ماهانه</CardTitle>
                <CardDescription>۲۰۰,۰۰۰ تومان / ماه</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <ul className="mb-6 flex-grow space-y-3 text-sm text-journal-light">
                  <li className="flex items-center">
                    <Check className="ml-2 h-4 w-4 text-green-500" />
                    تمام ویژگی‌های پلن آزمایشی
                  </li>
                  <li className="flex items-center">
                    <Check className="ml-2 h-4 w-4 text-green-500" />
                    حمایت مستقیم از نویسندگان
                  </li>
                  <li className="flex items-center">
                    <Check className="ml-2 h-4 w-4 text-green-500" />
                    بوکمارک کردن نامحدود
                  </li>
                  <li className="flex items-center">
                    <Check className="ml-2 h-4 w-4 text-green-500" />
                    تجربه بدون تبلیغات
                  </li>
                </ul>
                <Button
                  onClick={() => handleSubscribe("MONTHLY")}
                  disabled={!!isLoading}
                  className="mt-auto w-full bg-journal-green hover:bg-journal-green/90"
                >
                  {isLoading === "MONTHLY" ? <Loader2 className="animate-spin" /> : "انتخاب پلن ماهانه"}
                </Button>
              </CardContent>
            </Card>

            <Card className="relative flex flex-col ring-2 ring-journal-orange shadow-lg">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-journal-orange">۲ ماه رایگان</Badge>
              <CardHeader className="text-center">
                <Star className="mx-auto mb-4 h-10 w-10 text-journal-orange" />
                <CardTitle className="text-2xl font-bold text-journal">اشتراک سالانه</CardTitle>
                <CardDescription>۲,۰۰۰,۰۰۰ تومان / سال</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <ul className="mb-6 flex-grow space-y-3 text-sm text-journal-light">
                  <li className="flex items-center">
                    <Check className="ml-2 h-4 w-4 text-green-500" />
                    تمام ویژگی‌های پلن ماهانه
                  </li>
                  <li className="flex items-center font-bold text-journal">
                    <Check className="ml-2 h-4 w-4 text-green-500" />
                    تخفیف ویژه سالانه
                  </li>
                </ul>
                <Button
                  onClick={() => handleSubscribe("YEARLY")}
                  disabled={!!isLoading}
                  className="mt-auto w-full bg-journal-orange hover:bg-journal-orange/90"
                >
                  {isLoading === "YEARLY" ? <Loader2 className="animate-spin" /> : "انتخاب پلن سالانه"}
                </Button>
              </CardContent>
            </Card>

            <Card className="flex flex-col">
              <CardHeader className="text-center">
                <GraduationCap className="mx-auto mb-4 h-10 w-10 text-journal" />
                <CardTitle className="text-2xl font-bold text-journal">پلن دانشجویی</CardTitle>
                <CardDescription>۸۰,۰۰۰ تومان / ماه</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <ul className="mb-6 flex-grow space-y-3 text-sm text-journal-light">
                  <li className="flex items-center">
                    <Check className="ml-2 h-4 w-4 text-green-500" />
                    تمام ویژگی‌های پلن ماهانه
                  </li>
                  <li className="flex items-center">
                    <Check className="ml-2 h-4 w-4 text-green-500" />
                    تخفیف ویژه دانشجویی
                  </li>
                  <li className="flex items-center">
                    <Check className="ml-2 h-4 w-4 text-green-500" />
                    دعوت به رویدادهای ویژه
                  </li>
                </ul>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="student-card">بارگذاری کارت دانشجویی</Label>
                    <Input
                      id="student-card"
                      type="file"
                      accept="image/*"
                      onChange={(event) => setStudentFile(event.target.files?.[0] ?? null)}
                    />
                  </div>
                  <Button
                    onClick={() => handleSubscribe("STUDENT")}
                    disabled={!!isLoading || isUploading}
                    className="w-full bg-journal hover:bg-journal/90"
                  >
                    {isLoading === "STUDENT" || isUploading ? <Upload className="animate-bounce" /> : "درخواست تخفیف"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SubscriptionPageClient;
