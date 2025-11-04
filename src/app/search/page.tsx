import { buildStaticMetadata } from "@/lib/page-metadata";
import { SearchPageClient } from "./SearchPageClient";

export const metadata = buildStaticMetadata({
  title: "جستجو در روانک",
  description: "مقالات، نویسندگان و تگ‌های مورد نظر خود را در مجله روانک جستجو کنید.",
  path: "/search",
  keywords: ["جستجوی مقالات", "جستجوی نویسنده", "روانک"],
});

const SearchPage = () => {
  return <SearchPageClient />;
};

export default SearchPage;
