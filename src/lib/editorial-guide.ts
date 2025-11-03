import { prisma } from "@/lib/prisma";

const createUtcDate = (year: number, monthIndex: number, day: number) =>
  new Date(Date.UTC(year, monthIndex, day));

type CalendarSeed = {
  slug: string;
  title: string;
  focus: string;
  description: string;
  publishDate: Date;
};

const CALENDAR_SEEDS: CalendarSeed[] = [
  {
    slug: "winter-storytelling",
    title: "ویژه‌نامه زمستانی",
    focus: "قصه‌های الهام‌بخش پایان سال",
    description:
      "برای شمارهٔ زمستانی به روایت‌های جمع‌بندی سال، تجربه‌های شکست و برنامه‌ریزی برای سال جدید می‌پردازیم.",
    publishDate: createUtcDate(2025, 0, 20),
  },
  {
    slug: "nowruz-special",
    title: "پرونده نوروزی",
    focus: "بازآفرینی سنت‌ها و نوآوری‌های کوچک",
    description:
      "در آستانه نوروز از نویسندگان می‌خواهیم داستان‌های بازآفرینی سنتی، تغییرات مثبت و ایده‌های نو را با ما به اشتراک بگذارند.",
    publishDate: createUtcDate(2025, 2, 5),
  },
  {
    slug: "summer-lab",
    title: "آزمایشگاه تابستانی",
    focus: "پروژه‌های جمعی و یادگیری مشارکتی",
    description:
      "تابستان زمان اجرای پروژه‌های مشترک و گزارش پیشرفت آن‌هاست؛ تجربیات خود را در قالب سری مقالات مستند کنید.",
    publishDate: createUtcDate(2025, 5, 25),
  },
  {
    slug: "autumn-spotlight",
    title: "فصل برداشت",
    focus: "نشان‌دادن دستاوردهای شخصی و گروهی",
    description:
      "پاییز را به روایت دستاوردهای پژوهشی، توسعه محصول و رشد فردی اختصاص داده‌ایم.",
    publishDate: createUtcDate(2025, 8, 30),
  },
];

export const EDITORIAL_VALUES = [
  {
    title: "مهربان اما دقیق",
    description:
      "با زبانی صمیمی می‌نویسیم اما از دقت در نقل داده‌ها و اشاره به منابع معتبر غافل نمی‌شویم.",
    examples: [
      "به جای حکم قطعی، تجربه شخصی یا داده مستند ارائه کنید.",
      "اصطلاحات تخصصی را با واژه‌های ساده‌تر یا مثال همراه کنید.",
    ],
  },
  {
    title: "آینده‌نگر و امیدبخش",
    description:
      "هر گزارش یا تحلیل باید چشم‌اندازی برای قدم بعدی مخاطب ترسیم کند.",
    examples: [
      "در پایان مطلب حداقل یک اقدام کوچک پیشنهادی ارائه دهید.",
      "وقایع سخت را با درس‌آموخته‌ها و مسیر رشد جمع‌بندی کنید.",
    ],
  },
  {
    title: "همدل با جامعه",
    description:
      "مسائل را از زاویه دید مخاطبان فارسی‌زبان طرح می‌کنیم و تنوع تجربه‌ها را بازتاب می‌دهیم.",
    examples: [
      "از نقل‌قول یا مصاحبه با اعضای جامعه برای تکمیل روایت استفاده کنید.",
      "در انتخاب تصاویر و تیترها، حساسیت‌های فرهنگی و تنوع را در نظر بگیرید.",
    ],
  },
];

export const EDITORIAL_SECTIONS = [
  {
    title: "ماموریت سردبیری",
    body: "روانک خانه‌ای برای روایت تجربه‌های واقعی و قابل‌اعتماد است. هدف ما کمک به دیده‌شدن صداهای تازه و مستندسازی مسیر رشد فردی و جمعی است.",
    bullets: [
      "پوشش دادن روندهای نو در کسب‌وکار، فرهنگ و فناوری فارسی‌زبان",
      "پررنگ کردن داستان‌های انسانی پشت موفقیت‌ها و شکست‌ها",
      "تقویت روحیه یادگیری مشارکتی در میان نویسندگان و خوانندگان",
    ],
  },
  {
    title: "ساختار پیشنهادی هر مقاله",
    body: "برای حفظ انسجام مطالب، ساختار چهارگانه زیر را پیشنهاد می‌کنیم. البته بسته به ژانر، می‌توانید آن را شخصی‌سازی کنید.",
    bullets: [
      "شروع قوی با یک مسئله یا روایت کوتاه که خواننده را درگیر کند",
      "توضیح دقیق و مستند با بهره‌گیری از داده، مثال یا گفت‌وگو",
      "بخش تحلیل و درس‌آموخته‌ها برای تفسیر تجربه",
      "جمع‌بندی راهبردی همراه با دعوت به اقدام یا سوال باز",
    ],
  },
  {
    title: "قواعد ارسال محتوا",
    body: "برای اینکه فرآیند انتشار سریع و روان پیش برود، لطفاً هنگام ارسال مطلب به نکات زیر توجه کنید.",
    bullets: [
      "عنوان و لید حداکثر ۷۰ کاراکتر باشد و پیام اصلی را منتقل کند.",
      "منابع و ارجاعات را در انتهای متن با فرمت استاندارد ذکر کنید.",
      "در صورت استفاده از تصویر، حقوق مالکیت معنوی آن رعایت شده باشد.",
    ],
  },
];

export const EDITORIAL_TIPS = [
  {
    title: "چک‌لیست قبل از انتشار",
    items: [
      "خواندن دوباره متن با صدای بلند برای بررسی لحن",
      "کنترل لینک‌ها و اطمینان از در دسترس بودن منابع",
      "افزودن تصویر شاخص با کیفیت حداقل ۱۲۰۰ پیکسل",
    ],
  },
  {
    title: "چگونه تقویم را پر کنیم؟",
    items: [
      "برای هر رویداد، سه ایده اصلی و یک نقل‌قول کلیدی آماده کنید.",
      "در تیم‌های انتشارات، وظیفه تولید محتوا را میان اعضا تقسیم کنید.",
      "زمان‌بندی بازبینی و انتشار نهایی را در ابزار مدیریت پروژه ثبت کنید.",
    ],
  },
];

export async function ensureEditorialCalendarEntries() {
  await Promise.all(
    CALENDAR_SEEDS.map((seed) =>
      prisma.editorialCalendarEntry.upsert({
        where: { slug: seed.slug },
        create: seed,
        update: {
          title: seed.title,
          focus: seed.focus,
          description: seed.description,
          publishDate: seed.publishDate,
        },
      })
    )
  );
}

export async function getEditorialCalendarEntries(limit?: number) {
  return prisma.editorialCalendarEntry.findMany({
    orderBy: { publishDate: "asc" },
    take: limit,
  });
}

export async function getUpcomingEditorialEntries(limit = 3) {
  await ensureEditorialCalendarEntries();

  const today = new Date();
  return prisma.editorialCalendarEntry.findMany({
    where: {
      publishDate: {
        gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
      },
    },
    orderBy: { publishDate: "asc" },
    take: limit,
  });
}
