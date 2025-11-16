import { cookies } from "next/headers";
import { jwtVerify } from "jose";

import { buildStaticMetadata } from "@/lib/page-metadata";
import { SubscriptionPageClient } from "./SubscriptionPageClient";
import { prisma } from "@/lib/prisma";

export const metadata = buildStaticMetadata({
  title: "اشتراک‌های روانک",
  description: "پلن‌های اشتراک ماهانه، سالانه و دانشجویی مجله روانک را بررسی و گزینه مناسب خود را انتخاب کنید.",
  path: "/subscription",
  keywords: ["اشتراک روانک", "پلن اشتراک", "عضویت پریمیوم"],
});

const SubscriptionPage = async () => {
  const cookieStore = cookies();
  const token = cookieStore.get("token")?.value;

  let subscription: { tier: string; status: string; endDate: string | null } | null = null;
  let userName: string | null = null;

  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);
      const userId = payload.userId as number;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          name: true,
          subscription: {
            select: { tier: true, status: true, endDate: true },
          },
        },
      });

      userName = user?.name ?? null;
      subscription = user?.subscription
        ? {
            tier: user.subscription.tier,
            status: user.subscription.status,
            endDate: user.subscription.endDate?.toISOString() ?? null,
          }
        : null;
    } catch (error) {
      console.error("SUBSCRIPTION_PAGE_USER_LOOKUP_ERROR", error);
    }
  }

  return <SubscriptionPageClient initialSubscription={subscription} userName={userName} />;
};

export default SubscriptionPage;
