// src/app/api/me/avatar/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import sharp from "sharp";

export async function POST(req: Request) {
    const token = cookies().get("token")?.value;
    if (!token) {
        return new NextResponse("Authentication token not found", { status: 401 });
    }

    try {
        // 1. Authenticate user
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        const userId = payload.userId as number;
        if (!userId) {
            return new NextResponse("Invalid token payload", { status: 401 });
        }

        // 2. Handle file upload
        const data = await req.formData();
        const file: File | null = data.get("file") as unknown as File;

        if (!file) {
            return NextResponse.json({ message: "No file found" }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Optimize and convert image to JPEG
        const jpegBuffer = await sharp(buffer)
            .resize(200, 200) // Resize avatar to 200x200
            .jpeg({ quality: 80 })
            .toBuffer();

        const filename = `${userId}-${Date.now()}.jpeg`;
        const uploadsDir = join(process.cwd(), "public/uploads/avatars");
        await mkdir(uploadsDir, { recursive: true }); // Ensure directory exists

        const filePath = join(uploadsDir, filename);
        await writeFile(filePath, jpegBuffer);

        const avatarUrl = `/uploads/avatars/${filename}`;

        // 3. Update user in database
        await prisma.user.update({
            where: { id: userId },
            data: { avatarUrl },
        });

        return NextResponse.json({ success: true, url: avatarUrl });
    } catch (error) {
        console.error("AVATAR_UPLOAD_ERROR", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}