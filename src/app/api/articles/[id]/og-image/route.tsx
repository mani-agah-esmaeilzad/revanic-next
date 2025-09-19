import { ImageResponse } from '@vercel/og';
import { prisma } from '@/lib/prisma';
import { InstagramStory } from '@/components/share/InstagramStory';
import { NextRequest } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';

export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const articleId = parseInt(params.id, 10);
    if (isNaN(articleId)) {
      return new Response('Invalid article ID', { status: 400 });
    }

    const article = await prisma.article.findUnique({
      where: { id: articleId },
      include: { author: true },
    });

    if (!article || !article.author) {
      return new Response('Article or Author not found', { status: 404 });
    }
    
    // --- ۱. آماده‌سازی داده‌های متنی ---
    const wordsPerMinute = 200;
    const wordCount = article.content.split(/\s+/).length;
    const readTimeMinutes = Math.max(1, Math.ceil(wordCount / wordsPerMinute));
    const readTime = `${readTimeMinutes} دقیقه`;
    const authorName = article.author.name || 'کاربر روانیک';

    // --- ۲. آماده‌سازی تصویر مقاله (با تبدیل اجباری به JPEG) ---
    let coverImage: { src: string; width: number; height: number } | null = null;
    if (article.coverImageUrl) {
      const imagePath = path.join(process.cwd(), 'public', article.coverImageUrl);
      try {
        const imageBuffer = await fs.readFile(imagePath);
        // **مهم: تبدیل فایل به JPEG برای سازگاری**
        const jpegBuffer = await sharp(imageBuffer).jpeg().toBuffer();
        const metadata = await sharp(jpegBuffer).metadata();

        if (metadata.width && metadata.height) {
          coverImage = {
            src: `data:image/jpeg;base64,${jpegBuffer.toString('base64')}`,
            width: metadata.width,
            height: metadata.height,
          };
        }
      } catch (error) {
        console.error('Failed to load or convert cover image:', error);
      }
    }

    // --- ۳. آماده‌سازی لوگو (با تبدیل به JPEG) ---
    let logoImage: { src: string; width: number; height: number } | null = null;
    try {
      const logoPath = path.join(process.cwd(), 'public/lovable-uploads/a967c9ca-f718-42ce-a45b-07ccc9d9f0c5.png');
      const logoBuffer = await fs.readFile(logoPath);
      // **مهم: تبدیل لوگو به JPEG برای سازگاری**
      const jpegLogoBuffer = await sharp(logoBuffer).jpeg().toBuffer();
      const metadata = await sharp(jpegLogoBuffer).metadata();

      if(metadata.width && metadata.height){
        logoImage = {
            src: `data:image/jpeg;base64,${jpegLogoBuffer.toString('base64')}`,
            width: metadata.width,
            height: metadata.height,
        };
      }
    } catch (error) {
      console.error('Failed to load or convert logo:', error);
    }

    // --- ۴. خواندن فونت ---
    const fontPath = path.join(process.cwd(), 'public/fonts/Vazirmatn-Bold.ttf');
    const fontData = await fs.readFile(fontPath);

    return new ImageResponse(
      (
        <InstagramStory
          title={article.title}
          authorName={authorName}
          // آواتار پیش‌فرض از سرویس ui-avatars ساخته می‌شود
          authorAvatarUrl={`https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=e5e7eb&color=1f2937&font-size=0.5`}
          readTime={readTime}
          coverImage={coverImage}
          logo={logoImage}
        />
      ),
      {
        width: 1080,  // اندازه استاندارد برای استوری اینستاگرام
        height: 1920,
        fonts: [
          {
            name: 'Vazirmatn',
            data: fontData,
            style: 'normal',
            weight: 700,
          },
        ],
      }
    );

  } catch (e: any) {
    console.error('Failed to generate OG Image:', e);
    return new Response('Failed to generate image', { status: 500 });
  }
}

