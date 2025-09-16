// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');

  // 1. Clean up existing data
  await prisma.like.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.bookmark.deleteMany();
  // Disconnect categories from articles before deleting articles
  const articles = await prisma.article.findMany({ include: { categories: true } });
  for (const article of articles) {
    await prisma.article.update({
      where: { id: article.id },
      data: {
        categories: {
          disconnect: article.categories.map(c => ({ id: c.id }))
        }
      }
    });
  }
  await prisma.article.deleteMany();
  await prisma.category.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create Categories
  const techCategory = await prisma.category.create({ data: { name: 'فناوری' } });
  const historyCategory = await prisma.category.create({ data: { name: 'تاریخ' } });
  const artCategory = await prisma.category.create({ data: { name: 'هنر و معماری' } });
  const scienceCategory = await prisma.category.create({ data: { name: 'علم' } });

  console.log('Created categories');

  // 3. Create Users
  const hashedPassword1 = await bcrypt.hash('password123', 10);
  const user1 = await prisma.user.create({
    data: {
      email: 'ali@revanic.ir',
      name: 'علی رضایی',
      password: hashedPassword1,
      bio: 'نویسنده و علاقه‌مند به دنیای تکنولوژی و هوش مصنوعی. در روانیک از آینده می‌نویسم.',
      role: 'ADMIN', 
    },
  });

  const hashedPassword2 = await bcrypt.hash('password123', 10);
  const user2 = await prisma.user.create({
    data: {
      email: 'maryam@revanic.ir',
      name: 'مریم احمدی',
      password: hashedPassword2,
      bio: 'پژوهشگر تاریخ ایران باستان و علاقه‌مند به فرهنگ و هنر. سفری به دل تاریخ با من داشته باشید.',
      // نقش این کاربر به صورت پیش‌فرض "USER" خواهد بود
    },
  });
  
  console.log('Created users');

  // 4. Create Articles
  await prisma.article.create({
    data: {
      title: 'هوش مصنوعی و آینده‌ای که در انتظار ماست',
      content: 'بررسی تأثیرات هوش مصنوعی بر جامعه، اقتصاد و زندگی روزمره انسان‌ها. این فناوری چگونه جهان را تغییر خواهد داد؟ محتوای این مقاله به صورت کامل به بررسی این موضوع می‌پردازد و چشم‌اندازهای آینده را ترسیم می‌کند.',
      published: true,
      authorId: user1.id,
      categories: {
        connect: [{ id: techCategory.id }, {id: scienceCategory.id}],
      },
    },
  });

  await prisma.article.create({
    data: {
      title: 'سفری به دل تاریخ ایران باستان',
      content: 'کاوش در اعماق تمدن ایرانی و بررسی دستاوردهای باستانیان که هنوز در زندگی امروز ما تأثیرگذار هستند. از معماری هخامنشی تا علوم دوره ساسانی، همه و همه در این مقاله مورد بررسی قرار گرفته‌اند.',
      published: true,
      authorId: user2.id,
      categories: {
        connect: [{ id: historyCategory.id }],
      },
    },
  });
  
  await prisma.article.create({
    data: {
      title: 'روان‌شناسی رنگ‌ها در معماری مدرن',
      content: 'تأثیر رنگ‌ها بر روحیه انسان و چگونگی استفاده از این دانش در طراحی فضاهای زندگی و کار. این مقاله به شما کمک می‌کند تا انتخاب‌های بهتری برای محیط زندگی خود داشته باشید.',
      published: true,
      authorId: user2.id,
      categories: {
        connect: [{ id: artCategory.id }],
      },
    },
  });
  
  console.log('Created articles');

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });