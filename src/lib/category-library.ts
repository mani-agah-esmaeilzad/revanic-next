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
  keys: string[];
};

const buildCategoryKeys = (name: string) => {
  const trimmed = name.trim();
  const slug = slugify(trimmed);
  const slugNoHyphen = slug.replace(/-/g, "");
  const compact = trimmed.replace(/\s+/g, "");
  return Array.from(new Set([trimmed, slug, slugNoHyphen, compact]));
};

const defineCategory = (
  name: string,
  description: string,
  color: string,
  icon: LucideIcon,
): CategoryDefinition => ({
  slug: slugify(name),
  name,
  description,
  color,
  icon,
  keys: buildCategoryKeys(name),
});

export const CATEGORY_LIBRARY: CategoryDefinition[] = [
  defineCategory(
    "فناوری و نوآوری",
    "آخرین نوآوری‌ها، هوش مصنوعی و آینده دنیای دیجیتال",
    "bg-blue-500",
    Laptop,
  ),
  defineCategory(
    "تاریخ و تمدن",
    "سفر به گذشته و روایت تمدن‌های تاثیرگذار جهان",
    "bg-amber-500",
    History,
  ),
  defineCategory(
    "هنر و خلاقیت",
    "معماری، طراحی و الهامات خلاقانه هنرمندان",
    "bg-purple-500",
    Palette,
  ),
  defineCategory(
    "علم و کشف",
    "کشفیات تازه و تحلیل یافته‌های علمی",
    "bg-green-500",
    FlaskConical,
  ),
  defineCategory(
    "فرهنگ و جامعه",
    "جامعه، سبک زندگی و روایت‌های فرهنگی",
    "bg-rose-500",
    Globe,
  ),
  defineCategory(
    "سیاست و حکمرانی",
    "تحولات سیاسی ایران و جهان با نگاه تحلیلی",
    "bg-red-500",
    Building,
  ),
  defineCategory(
    "اقتصاد و کسب‌وکار",
    "کسب‌وکارها، بازار سرمایه و اقتصاد هوشمند",
    "bg-emerald-500",
    DollarSign,
  ),
  defineCategory(
    "ورزش و رقابت",
    "اخبار، تحلیل مسابقات و پشت‌صحنه قهرمانان",
    "bg-orange-500",
    Dumbbell,
  ),
  defineCategory(
    "سلامت و تندرستی",
    "پزشکی، تندرستی و سبک زندگی سالم",
    "bg-pink-500",
    Heart,
  ),
  defineCategory(
    "محیط زیست و پایداری",
    "طبیعت، تغییرات اقلیمی و پایداری زیست‌بوم",
    "bg-teal-500",
    Leaf,
  ),
  defineCategory(
    "ادبیات و کتاب",
    "کتاب‌ها، نقد ادبی و دنیای واژگان فارسی",
    "bg-indigo-500",
    BookOpen,
  ),
  defineCategory(
    "موسیقی و صدا",
    "آهنگسازان، آلبوم‌های تازه و تحلیل سبک‌ها",
    "bg-violet-500",
    Music,
  ),
];
