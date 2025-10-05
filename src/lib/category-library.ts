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

export type CategoryDefinition = {
  name: string;
  description: string;
  color: string;
  icon: LucideIcon;
};

export const CATEGORY_LIBRARY: CategoryDefinition[] = [
  {
    name: "فناوری و نوآوری",
    description: "آخرین نوآوری‌ها، هوش مصنوعی و آینده دنیای دیجیتال",
    color: "bg-blue-500",
    icon: Laptop,
  },
  {
    name: "تاریخ و تمدن",
    description: "سفر به گذشته و روایت تمدن‌های تاثیرگذار جهان",
    color: "bg-amber-500",
    icon: History,
  },
  {
    name: "هنر و خلاقیت",
    description: "معماری، طراحی و الهامات خلاقانه هنرمندان",
    color: "bg-purple-500",
    icon: Palette,
  },
  {
    name: "علم و کشف",
    description: "کشفیات تازه و تحلیل یافته‌های علمی",
    color: "bg-green-500",
    icon: FlaskConical,
  },
  {
    name: "فرهنگ و جامعه",
    description: "جامعه، سبک زندگی و روایت‌های فرهنگی",
    color: "bg-rose-500",
    icon: Globe,
  },
  {
    name: "سیاست و حکمرانی",
    description: "تحولات سیاسی ایران و جهان با نگاه تحلیلی",
    color: "bg-red-500",
    icon: Building,
  },
  {
    name: "اقتصاد و کسب‌وکار",
    description: "کسب‌وکارها، بازار سرمایه و اقتصاد هوشمند",
    color: "bg-emerald-500",
    icon: DollarSign,
  },
  {
    name: "ورزش و رقابت",
    description: "اخبار، تحلیل مسابقات و پشت‌صحنه قهرمانان",
    color: "bg-orange-500",
    icon: Dumbbell,
  },
  {
    name: "سلامت و تندرستی",
    description: "پزشکی، تندرستی و سبک زندگی سالم",
    color: "bg-pink-500",
    icon: Heart,
  },
  {
    name: "محیط زیست و پایداری",
    description: "طبیعت، تغییرات اقلیمی و پایداری زیست‌بوم",
    color: "bg-teal-500",
    icon: Leaf,
  },
  {
    name: "ادبیات و کتاب",
    description: "کتاب‌ها، نقد ادبی و دنیای واژگان فارسی",
    color: "bg-indigo-500",
    icon: BookOpen,
  },
  {
    name: "موسیقی و صدا",
    description: "آهنگسازان، آلبوم‌های تازه و تحلیل سبک‌ها",
    color: "bg-violet-500",
    icon: Music,
  },
];
