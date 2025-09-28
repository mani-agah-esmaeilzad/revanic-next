// src/app/api/upload/route.ts
import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import sharp from 'sharp';

// پیکربندی Cloudinary با استفاده از متغیرهای محیطی
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function POST(req: Request) {
  const data = await req.formData();
  const file: File | null = data.get('file') as unknown as File;

  if (!file) {
    return NextResponse.json({ success: false, error: "No file found" }, { status: 400 });
  }

  try {
    // ۱. خواندن فایل و تبدیل آن به بافر
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // ۲. بهینه‌سازی تصویر با Sharp (اختیاری اما پیشنهادی)
    const jpegBuffer = await sharp(buffer)
      .jpeg({ quality: 80 })
      .toBuffer();

    // ۳. آپلود بافر تصویر در Cloudinary به صورت استریم
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          // می‌توانید پوشه‌ای در Cloudinary برای آپلودها تعیین کنید
          folder: 'revanic_uploads', 
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
      // ارسال بافر به استریم
      uploadStream.end(jpegBuffer);
    });

    // بررسی نوع نتیجه برای دسترسی امن به url
    const result = uploadResult as { secure_url?: string };

    if (result.secure_url) {
      // ۴. بازگرداندن URL امن تصویر از Cloudinary
      return NextResponse.json({ success: true, url: result.secure_url });
    } else {
      throw new Error("Cloudinary upload failed, no secure_url returned.");
    }

  } catch (error) {
    console.error('Upload failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown upload error';
    return NextResponse.json({ success: false, error: 'Upload failed', details: errorMessage }, { status: 500 });
  }
}