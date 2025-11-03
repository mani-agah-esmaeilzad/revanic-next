// src/app/register/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { useEventTracker, applyJourneyHeader } from "@/hooks/useEventTracker";
import { useExperiment } from "@/components/ExperimentProvider";

const Register = () => {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const track = useEventTracker();
  const ctaVariant = useExperiment('registration_cta');

  useEffect(() => {
    track({ name: 'page_view', payload: { page: 'register' } });
  }, [track]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("رمزهای عبور مطابقت ندارند.");
      setIsLoading(false);
      return;
    }

    track({
      name: 'registration_started',
      payload: { method: 'email', variant: ctaVariant },
      experimentId: 'registration_cta',
      variant: ctaVariant,
    });

    try {
      const response = await fetch(
        "/api/auth/register",
        applyJourneyHeader({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name, email, password }),
        })
      );

      if (response.ok) {
        track({
          name: 'registration_completed',
          payload: { method: 'email' },
        });
        // --- FIX: Redirect to subscription page ---
        router.push("/subscription");
      } else {
        const data = await response.text();
        setError(data || "خطایی در ثبت نام رخ داد.");
        track({
          name: 'registration_failed',
          payload: { reason: data || 'unknown' },
        });
      }
    } catch (err) {
      setError("خطای شبکه. لطفاً دوباره تلاش کنید.");
      track({
        name: 'registration_failed',
        payload: { reason: 'network_error' },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const ctaLabel = ctaVariant === 'social_proof'
    ? 'ثبت‌نام و پیوستن به ۳۰۰۰+ خواننده'
    : 'ثبت‌نام و شروع رایگان';

  const subtitleCopy = ctaVariant === 'social_proof'
    ? 'به جامعه فعال نویسندگان و خوانندگان روانک بپیوندید.'
    : 'شروع سفر نویسندگی شما از همین‌جا است.';

  return (
    <div className="min-h-screen bg-gradient-to-br from-journal-cream via-background to-journal-cream/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-medium">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <Logo size="lg" />
          </div>
          <CardTitle className="text-2xl font-bold text-journal">
            ثبت نام در مجله روانک
          </CardTitle>
          <p className="text-journal-light">{subtitleCopy}</p>
        </CardHeader>

        <CardContent className="space-y-4">
          <form onSubmit={handleRegister} className="space-y-4">
            {/* Name Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-journal">
                نام و نام خانوادگی
              </label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-journal-light h-4 w-4" />
                <Input
                  type="text"
                  placeholder="نام کامل خود را وارد کنید"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pr-10"
                  required
                />
              </div>
            </div>

            {/* Email Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-journal">ایمیل</label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-journal-light h-4 w-4" />
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

            {/* Password Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-journal">
                رمز عبور
              </label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-journal-light h-4 w-4" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="رمز عبور قوی انتخاب کنید"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10 pl-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-journal-light hover:text-journal"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-journal">
                تأیید رمز عبور
              </label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-journal-light h-4 w-4" />
                <Input
                  type="password"
                  placeholder="رمز عبور را دوباره وارد کنید"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pr-10"
                  required
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            {/* Terms */}
            <div className="text-xs text-journal-light">
              با ثبت نام، شما با{" "}
              <Link
                href={`/terms`}
                className="text-journal-orange hover:underline"
              >
                شرایط استفاده
              </Link>{" "}
              و{" "}
              <Link
                href={`/privacy`}
                className="text-journal-orange hover:underline"
              >
                حریم خصوصی
              </Link>{" "}
              ما موافقت می‌کنید.
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-journal-green text-white hover:bg-journal-green-light"
              disabled={isLoading}
            >
              {isLoading ? "در حال ثبت نام..." : ctaLabel}
            </Button>
          </form>

          <Separator />

          {/* Social Login */}
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full border-journal-green/20"
            >
              <svg className="ml-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              ثبت نام با Google
            </Button>
          </div>

          <Separator />

          {/* Login Link */}
          <div className="text-center">
            <p className="text-journal-light">
              قبلاً حساب دارید؟{" "}
              <Link
                href={`/login`}
                className="text-journal-orange hover:underline font-medium"
              >
                وارد شوید
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
