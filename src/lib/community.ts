import { prisma } from "@/lib/prisma";

export type CommunityStorySeed = {
  slug: string;
  title: string;
  excerpt: string;
  achievement: string;
  quote?: string;
  contributorName: string;
  contributorRole?: string;
  featuredImageUrl?: string;
  publicationSlug?: string;
};

const COMMUNITY_STORY_SEEDS: CommunityStorySeed[] = [
  {
    slug: "editor-choice-tech",
    title: "پیشرفت تیم فناوری در یک سال",
    excerpt:
      "تیم فناوری روانک با پیاده‌سازی زیرساخت تحلیلی جدید، زمان انتشار مقالات را نصف کرد و همکاری بین نویسندگان را بهبود داد.",
    achievement: "۵۰٪ افزایش سرعت انتشار",
    quote: "همکاری نزدیک بین تیم محتوا و فنی باعث شد نسخه جدید پلتفرم تنها در شش هفته آماده شود.",
    contributorName: "نرگس مرادی",
    contributorRole: "سردبیر فناوری",
    featuredImageUrl: "/images/community/tech-team.jpg",
    publicationSlug: "tech-journal",
  },
  {
    slug: "culture-circle-growth",
    title: "باشگاه مطالعه فرهنگ و جامعه",
    excerpt:
      "گروه فرهنگ با برگزاری نشست‌های ماهانه و دعوت از پژوهشگران مهمان، شبکه‌ای پویا برای گفت‌وگو درباره سبک زندگی ساخت.",
    achievement: "۴۰۰ عضو فعال در سه ماه",
    quote: "اعضای باشگاه مطالعه می‌گویند هر نشست به آن‌ها ایده‌ای تازه برای مقاله بعدی می‌دهد.",
    contributorName: "مهران قنبری",
    contributorRole: "هماهنگ‌کننده جامعه",
    featuredImageUrl: "/images/community/culture-circle.jpg",
    publicationSlug: "culture-club",
  },
  {
    slug: "newsletter-success",
    title: "خبرنامه هفتگی و رکورد تعامل",
    excerpt:
      "خبرنامه روزهای شنبه با مرور مقالات برگزیده و نکات پشت‌صحنه، نرخ کلیک ۳۵ درصدی و بازخورد مثبت گسترده دریافت کرده است.",
    achievement: "۳۵٪ نرخ کلیک در خبرنامه",
    quote: "وقتی داستان موفقیت نویسندگان را روایت می‌کنیم، خوانندگان برای همکاری داوطلب می‌شوند.",
    contributorName: "پریسا داوودی",
    contributorRole: "راوی جامعه",
    featuredImageUrl: "/images/community/newsletter-team.jpg",
  },
];

export async function ensureCommunityStories() {
  const publications = await prisma.publication.findMany({ select: { id: true, slug: true } });
  const publicationMap = new Map(publications.map((pub) => [pub.slug, pub.id]));

  for (const seed of COMMUNITY_STORY_SEEDS) {
    const publicationId = seed.publicationSlug
      ? publicationMap.get(seed.publicationSlug) ?? null
      : null;

    await prisma.communityStory.upsert({
      where: { slug: seed.slug },
      create: {
        slug: seed.slug,
        title: seed.title,
        excerpt: seed.excerpt,
        achievement: seed.achievement,
        quote: seed.quote ?? null,
        contributorName: seed.contributorName,
        contributorRole: seed.contributorRole ?? null,
        featuredImageUrl: seed.featuredImageUrl ?? null,
        ...(publicationId
          ? {
              publication: {
                connect: { id: publicationId },
              },
            }
          : {}),
      },
      update: {
        title: seed.title,
        excerpt: seed.excerpt,
        achievement: seed.achievement,
        quote: seed.quote ?? null,
        contributorName: seed.contributorName,
        contributorRole: seed.contributorRole ?? null,
        featuredImageUrl: seed.featuredImageUrl ?? null,
        ...(publicationId
          ? {
              publication: {
                connect: { id: publicationId },
              },
            }
          : {
              publication: {
                disconnect: true,
              },
            }),
      },
    });
  }
}

export async function getCommunityStories(options: {
  limit?: number;
  publicationId?: number;
} = {}) {
  const { limit, publicationId } = options;

  return prisma.communityStory.findMany({
    where: publicationId ? { publicationId } : undefined,
    include: {
      publication: {
        select: { id: true, name: true, slug: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getFeaturedCommunityStories(limit = 3) {
  await ensureCommunityStories();
  return getCommunityStories({ limit });
}

export async function getStoriesGroupedByPublication(publicationIds: number[]) {
  type StoryWithPublication = Awaited<ReturnType<typeof getCommunityStories>>[number];

  if (publicationIds.length === 0) {
    return {} as Record<number, StoryWithPublication[]>;
  }

  const stories = await prisma.communityStory.findMany({
    where: { publicationId: { in: publicationIds } },
    include: {
      publication: {
        select: { id: true, name: true, slug: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return stories.reduce<Record<number, StoryWithPublication[]>>((acc, story) => {
    if (!story.publicationId) {
      return acc;
    }

    if (!acc[story.publicationId]) {
      acc[story.publicationId] = [];
    }

    acc[story.publicationId].push(story);
    return acc;
  }, {});
}
