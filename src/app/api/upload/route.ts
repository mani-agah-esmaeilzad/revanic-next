// src/app/api/upload/route.ts
import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export async function POST(req: Request) {
  // 1. احراز هویت کاربر (بدون تغییر)
  const token = cookies().get('token')?.value;
  if (!token) {
    return new NextResponse('Authentication token not found', { status: 401 });
  }
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    await jwtVerify(token, secret);
  } catch (error) {
    return new NextResponse('Invalid token', { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return new NextResponse('No file provided', { status: 400 });
    }

    // تبدیل فایل به بافر
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // ایجاد یک نام منحصر به فرد برای فایل
    const filename = `${Date.now()}_${file.name.replaceAll(' ', '_')}`;
    const uploadDir = path.join(process.cwd(), 'public/uploads');

    // اطمینان از وجود پوشه آپلود
    try {
      await fs.access(uploadDir);
    } catch (error) {
      await fs.mkdir(uploadDir, { recursive: true });
    }

    // ذخیره فایل در مسیر نهایی
    await fs.writeFile(path.join(uploadDir, filename), buffer);

    // بازگرداندن آدرس عمومی فایل
    const publicUrl = `/uploads/${filename}`;
    
    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error('File upload error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}