import { buildStaticMetadata } from "@/lib/page-metadata";
import { SubscriptionPageClient } from "./SubscriptionPageClient";

export const metadata = buildStaticMetadata({
  title: "اشتراک‌های روانک",
  description: "پلن‌های اشتراک ماهانه، سالانه و دانشجویی مجله روانک را بررسی و گزینه مناسب خود را انتخاب کنید.",
  path: "/subscription",
  keywords: ["اشتراک روانک", "پلن اشتراک", "عضویت پریمیوم"],
});

const SubscriptionPage = () => {
  return <SubscriptionPageClient />;
};

export default SubscriptionPage;
