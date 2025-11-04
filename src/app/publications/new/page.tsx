import { buildStaticMetadata } from "@/lib/page-metadata";
import { NewPublicationForm } from "./NewPublicationForm";

export const metadata = buildStaticMetadata({
  title: "ایجاد نشریه جدید در روانک",
  description: "با ساخت نشریه جدید در روانک فضای مشترکی برای همکاری نویسندگان و انتشار محتوای گروهی ایجاد کنید.",
  path: "/publications/new",
  keywords: ["ساخت نشریه", "انتشارات جدید روانک", "همکاری نویسندگان"],
});

const NewPublicationPage = () => {
  return <NewPublicationForm />;
};

export default NewPublicationPage;
