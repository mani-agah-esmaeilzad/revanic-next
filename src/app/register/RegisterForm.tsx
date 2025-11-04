"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, User, Eye, EyeOff } from "lucide-react";

import Logo from "@/components/Logo";
import { useEventTracker, applyJourneyHeader } from "@/hooks/useEventTracker";
import { useExperiment } from "@/components/ExperimentProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const RegisterForm = () => {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const track = useEventTracker();
  const ctaVariant = useExperiment("registration_cta");

  useEffect(() => {
    track({ name: "page_view", payload: { page: "register" } });
  }, [track]);

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("رمزهای عبور مطابقت ندارند.");
      setIsLoading(false);
      return;
    }

    track({
      name: "registration_started",
      payload: { method: "email", variant: ctaVariant },
      experimentId: "registration_cta",
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
        }),
      );

      if (response.ok) {
        track({ name: "registration_completed", payload: { method: "email" } });
        router.push("/subscription");
      } else {
        const data = await response.text();
        setError(data || "خطایی در ثبت نام رخ داد.");
        track({ name: "registration_failed", payload: { reason: data || "unknown" } });
      }
    } catch {
      setError("خطای شبکه. لطفاً دوباره تلاش کنید.");
      track({ name: "registration_failed", payload: { reason: "network_error" } });
    } finally {
      setIsLoading(false);
    }
  };

  const ctaLabel =
    ctaVariant === "social_proof" ? "ثبت‌نام و پیوستن به ۳۰۰۰+ خواننده" : "ثبت‌نام و شروع رایگان";

  const subtitleCopy =
    ctaVariant === "social_proof"
      ? "به جامعه فعال نویسندگان و خوانندگان روانک بپیوندید."
      : "شروع سفر نویسندگی شما از همین‌جا است.";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-journal-cream via-background to-journal-cream/50 p-4">
      <Card className="w-full max-w-md shadow-medium">
        <CardHeader className="pb-4 text-center">
          <div className="mb-4 flex justify-center">
            <Logo size="lg" />
          </div>
          <CardTitle className="text-2xl font-bold text-journal">ثبت نام در مجله روانک</CardTitle>
          <p className="text-journal-light">{subtitleCopy}</p>
        </CardHeader>

        <CardContent className="space-y-4">
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-journal">نام و نام خانوادگی</label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-journal-light" />
                <Input
                  type="text"
                  placeholder="نام کامل خود را وارد کنید"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="pr-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-journal">ایمیل</label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-journal-light" />
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
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
                  placeholder="رمز عبور قوی انتخاب کنید"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="pr-10 pl-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 transform text-journal-light hover:text-journal"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-journal">تکرار رمز عبور</label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-journal-light" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="رمز عبور خود را دوباره وارد کنید"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="pr-10"
                  required
                />
              </div>
            </div>

            {error ? <p className="text-sm text-red-500">{error}</p> : null}

            <Button
              type="submit"
              className="w-full bg-journal-green text-white hover:bg-journal-green-light"
              disabled={isLoading}
            >
              {isLoading ? "در حال ثبت‌نام..." : ctaLabel}
            </Button>
          </form>

          <Separator />

          <p className="text-center text-sm text-muted-foreground">
            حساب دارید؟{" "}
            <Link href="/login" className="font-medium text-journal-green hover:underline">
              وارد شوید
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterForm;
