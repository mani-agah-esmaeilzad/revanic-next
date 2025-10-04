// src/app/api/upload/route.ts
import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

// پیکربندی Cloudinary با استفاده از متغیرهای محیطی
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const data = await req.formData();
  const file = data.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { success: false, error: "فایلی برای آپلود ارسال نشده است." },
      { status: 400 }
    );
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
    return NextResponse.json(
      {
        success: false,
        error: "فرمت فایل پشتیبانی نمی‌شود. تنها فرمت‌های JPEG، PNG و WebP مجاز هستند.",
      },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      {
        success: false,
        error: "حجم فایل بیشتر از حد مجاز (۵ مگابایت) است.",
      },
      { status: 400 }
    );
  }

  try {
    // ۱. خواندن فایل و تبدیل آن به بافر
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes) as Buffer;

    // ۲. تلاش برای بهینه‌سازی تصویر با Sharp، در صورت موجود نبودن، بافر اصلی استفاده می‌شود
    let optimizedBuffer = buffer;
    const shouldOptimize = file.type === "image/jpeg";
    if (shouldOptimize) {
      try {
        type SharpModule = typeof import("sharp");
        const imported = await import("sharp");
        const sharpFactory =
          ((imported as unknown as { default?: SharpModule }).default ?? (imported as unknown as SharpModule));
        optimizedBuffer = await sharpFactory(buffer).jpeg({ quality: 80 }).toBuffer();
      } catch (optimizationError) {
        console.warn("Sharp unavailable, skipping image optimization:", optimizationError);
      }
    }

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
      uploadStream.end(optimizedBuffer);
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
    console.error("Upload failed:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown upload error";
    return NextResponse.json(
      { success: false, error: "آپلود فایل با خطا مواجه شد.", details: errorMessage },
      { status: 500 }
    );
  }
}
