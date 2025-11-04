import { buildStaticMetadata } from "@/lib/page-metadata";
import { ContactPageClient } from "./ContactPageClient";

export const metadata = buildStaticMetadata({
  title: "تماس با مجله روانک",
  description: "برای ارتباط با تیم مجله روانک پیام ارسال کنید و اطلاعات تماس و ساعات پاسخ‌گویی را ببینید.",
  path: "/contact",
  keywords: ["تماس با روانک", "پشتیبانی روانک", "ارتباط با مجله"],
});

const ContactPage = () => {
  return <ContactPageClient />;
};

export default ContactPage;
