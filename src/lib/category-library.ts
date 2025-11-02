import {
  Laptop,
  History,
  Palette,
  FlaskConical,
  Globe,
  Building,
  DollarSign,
  Dumbbell,
  Heart,
  Leaf,
  BookOpen,
  Music,
  LucideIcon,
} from "lucide-react";
import { slugify } from "./slug";

export type CategoryDefinition = {
  slug: string;
  name: string;
  description: string;
  color: string;
  icon: LucideIcon;
  aliases: string[];
  keys: string[];
};

const buildCategoryKeys = (name: string, aliases: string[] = []) => {
  const sourceNames = [name, ...aliases]
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  const keySet = new Set<string>();

  sourceNames.forEach((value) => {
    const slug = slugify(value);
    keySet.add(value);
    keySet.add(slug);
    keySet.add(slug.replace(/-/g, ""));
    keySet.add(value.replace(/\s+/g, ""));
  });

  return Array.from(keySet);
};

const defineCategory = (
  name: string,
  description: string,
  color: string,
  icon: LucideIcon,
  aliases: string[] = [],
): CategoryDefinition => ({
  slug: slugify(name),
  name,
  description,
  color,
  icon,
  aliases,
  keys: buildCategoryKeys(name, aliases),
});

export const CATEGORY_LIBRARY: CategoryDefinition[] = [
  defineCategory(
    "فناوری و نوآوری",
    "آخرین نوآوری‌ها، هوش مصنوعی و آینده دنیای دیجیتال",
    "bg-blue-500",
    Laptop,
    ["فناوری", "تکنولوژی", "technology", "tech"],
  ),
  defineCategory(
    "تاریخ و تمدن",
    "سفر به گذشته و روایت تمدن‌های تاثیرگذار جهان",
    "bg-amber-500",
    History,
    ["تاریخ", "تمدن", "history"],
  ),
  defineCategory(
    "هنر و خلاقیت",
    "معماری، طراحی و الهامات خلاقانه هنرمندان",
    "bg-purple-500",
    Palette,
    ["هنر", "معماری", "art", "architecture"],
  ),
  defineCategory(
    "علم و کشف",
    "کشفیات تازه و تحلیل یافته‌های علمی",
    "bg-green-500",
    FlaskConical,
    ["علم", "علوم", "science"],
  ),
  defineCategory(
    "فرهنگ و جامعه",
    "جامعه، سبک زندگی و روایت‌های فرهنگی",
    "bg-rose-500",
    Globe,
    ["فرهنگ", "جامعه", "culture", "community"],
  ),
  defineCategory(
    "سیاست و حکمرانی",
    "تحولات سیاسی ایران و جهان با نگاه تحلیلی",
    "bg-red-500",
    Building,
    ["سیاست", "حکومت", "politics", "government"],
  ),
  defineCategory(
    "اقتصاد و کسب‌وکار",
    "کسب‌وکارها، بازار سرمایه و اقتصاد هوشمند",
    "bg-emerald-500",
    DollarSign,
    ["اقتصاد", "کسب‌وکار", "business", "economy"],
  ),
  defineCategory(
    "ورزش و رقابت",
    "اخبار، تحلیل مسابقات و پشت‌صحنه قهرمانان",
    "bg-orange-500",
    Dumbbell,
    ["ورزش", "رقابت", "sports"],
  ),
  defineCategory(
    "سلامت و تندرستی",
    "پزشکی، تندرستی و سبک زندگی سالم",
    "bg-pink-500",
    Heart,
    ["سلامت", "تندرستی", "health", "wellness"],
  ),
  defineCategory(
    "محیط زیست و پایداری",
    "طبیعت، تغییرات اقلیمی و پایداری زیست‌بوم",
    "bg-teal-500",
    Leaf,
    ["محیط زیست", "طبیعت", "environment", "sustainability"],
  ),
  defineCategory(
    "ادبیات و کتاب",
    "کتاب‌ها، نقد ادبی و دنیای واژگان فارسی",
    "bg-indigo-500",
    BookOpen,
    ["ادبیات", "کتاب", "literature", "books"],
  ),
  defineCategory(
    "موسیقی و صدا",
    "آهنگسازان، آلبوم‌های تازه و تحلیل سبک‌ها",
    "bg-violet-500",
    Music,
    ["موسیقی", "صدا", "music", "audio"],
  ),
];
