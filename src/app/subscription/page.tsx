"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Star, Crown, Zap } from "lucide-react";

const Subscription = () => {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">(
    "monthly",
  );
  const [isLoading, setIsLoading] = useState<string | null>(null); // Store the name of the loading plan
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  const plans = [
    {
      name: "طلایی",
      tier: "GOLD",
      price: { monthly: 49000, yearly: 490000 },
      icon: Crown,
      popular: true,
      features: [
        "خواندن نامحدود مقالات",
        "دسترسی به محتوای ویژه",
        "دانلود مقالات به صورت PDF",
        "حمایت از نویسندگان",
        "بدون تبلیغات",
      ],
    },
    {
      name: "پلاتینی",
      tier: "PLATINUM",
      price: { monthly: 89000, yearly: 890000 },
      icon: Zap,
      popular: false,
      features: [
        "تمام مزایای طرح طلایی",
        "جلسات آنلاین با نویسندگان",
        "دسترسی به آرشیو کامل مجله",
        "پشتیبانی اولویت‌دار",
      ],
    },
  ];

  const handleSubscribe = async (tier: string) => {
    setIsLoading(tier);
    setMessage(null);

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });

      if (response.ok) {
        setMessage(`اشتراک ${tier} با موفقیت برای شما فعال شد!`);
        router.refresh(); // Refresh server components to reflect new status
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

  const formatPrice = (price: number) => {
    return price.toLocaleString("fa-IR");
  };

  return (
    <div className="min-h-screen bg-background">
      <section className="py-16 bg-journal-cream/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-journal mb-4">
              طرح‌های اشتراک مجله روانیک
            </h1>
            <p className="text-xl text-journal-light mb-8">
              از میان طرح‌های متنوع ما، بهترین گزینه را برای خود انتخاب کنید
            </p>
            {message && (
              <div
                className={`p-4 mb-4 text-center rounded-lg ${message.includes("موفقیت") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
              >
                {message}
              </div>
            )}
            <div className="inline-flex bg-journal-cream rounded-lg p-1 mb-8">
              <button
                onClick={() => setBillingPeriod("monthly")}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                  billingPeriod === "monthly"
                    ? "bg-journal-green text-white shadow-sm"
                    : "text-journal-light hover:text-journal"
                }`}
              >
                ماهانه
              </button>
              <button
                onClick={() => setBillingPeriod("yearly")}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                  billingPeriod === "yearly"
                    ? "bg-journal-green text-white shadow-sm"
                    : "text-journal-light hover:text-journal"
                }`}
              >
                سالانه (۲ماه رایگان)
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {plans.map((plan) => (
                <Card
                  key={plan.name}
                  className={`relative shadow-soft border-0 flex flex-col ${
                    plan.popular
                      ? "ring-2 ring-journal-orange shadow-medium"
                      : ""
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-journal-orange text-white px-4 py-1 rounded-full text-sm font-medium">
                        محبوب‌ترین
                      </span>
                    </div>
                  )}

                  <CardHeader className="text-center pb-4">
                    <div className="flex justify-center mb-4">
                      <div
                        className={`p-3 rounded-lg ${
                          plan.popular
                            ? "bg-journal-orange"
                            : "bg-journal-green"
                        } text-white`}
                      >
                        <plan.icon className="h-6 w-6" />
                      </div>
                    </div>
                    <CardTitle className="text-2xl font-bold text-journal">
                      {plan.name}
                    </CardTitle>
                    <div className="mt-4">
                      <div className="text-4xl font-bold text-journal">
                        {`${formatPrice(plan.price[billingPeriod])} تومان`}
                      </div>
                      <p className="text-journal-light text-sm mt-1">
                        {billingPeriod === "monthly" ? "در ماه" : "در سال"}
                      </p>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-4 flex flex-col flex-grow">
                    <div className="space-y-3 mb-6 flex-grow">
                      {plan.features.map((feature, featureIndex) => (
                        <div
                          key={featureIndex}
                          className="flex items-start gap-3"
                        >
                          <Check className="h-5 w-5 text-journal-green flex-shrink-0 mt-0.5" />
                          <span className="text-journal-light text-sm">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>

                    <Button
                      onClick={() => handleSubscribe(plan.tier)}
                      disabled={isLoading === plan.tier}
                      className={`w-full mt-auto ${
                        plan.popular
                          ? "bg-journal-orange text-white hover:bg-journal-orange/90"
                          : "bg-journal-green text-white hover:bg-journal-green-light"
                      }`}
                    >
                      {isLoading === plan.tier
                        ? "در حال پردازش..."
                        : `خرید اشتراک ${plan.name}`}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Subscription;
