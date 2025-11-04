"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Logo from "@/components/Logo";

export const LoginForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const queryError = searchParams.get("error");
    if (!queryError) {
      return;
    }

    const messages: Record<string, string> = {
      google_oauth_not_configured: "ورود با گوگل در حال حاضر فعال نیست.",
      google_oauth_state_mismatch: "درخواست ورود با گوگل معتبر نبود. لطفاً دوباره تلاش کنید.",
      google_oauth_missing_code: "گوگل کدی برای تأیید ورود ارسال نکرد. لطفاً دوباره تلاش کنید.",
      google_oauth_token_exchange_failed: "در فرآیند تأیید گوگل مشکلی پیش آمد. لطفاً دوباره تلاش کنید.",
      google_oauth_userinfo_failed: "اطلاعات پروفایل گوگل در دسترس نبود. لطفاً دوباره تلاش کنید.",
      google_oauth_missing_email: "گوگل ایمیلی برای حساب شما ارائه نکرد. نمی‌توانیم ورود را ادامه دهیم.",
      google_oauth_unexpected_error: "خطای غیرمنتظره‌ای هنگام ورود با گوگل رخ داد.",
      google_oauth_denied: "فرآیند ورود با گوگل لغو شد.",
      server_error: "در سرور مشکلی پیش آمده است. لطفاً بعداً دوباره تلاش کنید.",
    };

    setError(messages[queryError] ?? "ورود با گوگل با مشکل مواجه شد. لطفاً دوباره تلاش کنید.");
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        router.push("/profile");
        router.refresh();
      } else {
        const data = await response.text();
        setError(data || "ایمیل یا رمز عبور نامعتبر است.");
      }
    } catch {
      setError("خطای شبکه. لطفاً دوباره تلاش کنید.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = useCallback(() => {
    setIsLoading(true);
    window.location.href = "/api/auth/google";
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-journal-cream via-background to-journal-cream/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-medium">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <Logo size="lg" />
          </div>
          <CardTitle className="text-2xl font-bold text-journal">ورود به حساب کاربری</CardTitle>
          <p className="text-journal-light">به مجله روانک خوش آمدید</p>
        </CardHeader>

        <CardContent className="space-y-4">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-journal">ایمیل</label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-journal-light" />
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pr-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-journal">رمز عبور</label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-journal-light" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="رمز عبور خود را وارد کنید"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10 pl-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 transform text-journal-light hover:text-journal"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error ? <p className="text-sm text-red-500">{error}</p> : null}

            <div className="flex justify-end">
              <Link href="/forget-password" className="text-sm text-journal-orange hover:underline">
                رمز عبور را فراموش کرده‌اید؟
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full bg-journal-green text-white hover:bg-journal-green-light"
              disabled={isLoading}
            >
              {isLoading ? "در حال ورود..." : "ورود"}
            </Button>
          </form>

          <Separator />

          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              className="w-full border-journal-green text-journal hover:bg-journal-green/10"
              onClick={handleGoogleLogin}
              disabled={isLoading}
            >
              {isLoading ? "در حال انتقال..." : "ورود با Google"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              حساب ندارید؟{" "}
              <Link href="/register" className="text-journal-green font-medium hover:underline">
                ثبت‌نام کنید
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
