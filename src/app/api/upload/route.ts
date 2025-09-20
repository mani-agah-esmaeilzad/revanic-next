import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import sharp from 'sharp';

export async function POST(req: Request) {
  const data = await req.formData();
  const file: File | null = data.get('file') as unknown as File;

  if (!file) {
    return NextResponse.json({ success: false, error: "No file found" }, { status: 400 });
  }

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // تبدیل تصویر به JPEG
    const jpegBuffer = await sharp(buffer)
      .jpeg({ quality: 80 })
      .toBuffer();

    // نام فایل جدید
    const originalName = file.name.split('.').slice(0, -1).join('.') || 'image';
    const newFilename = `${Date.now()}_${originalName}.jpeg`;

    const uploadsDir = join(process.cwd(), 'public/uploads');
    await mkdir(uploadsDir, { recursive: true });

    const filePath = join(uploadsDir, newFilename);
    await writeFile(filePath, jpegBuffer);

    const publicUrl = `/uploads/${newFilename}`;
    return NextResponse.json({ success: true, url: publicUrl });

  } catch (error) {
    console.error('Upload failed:', error);
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 });
  }
}
