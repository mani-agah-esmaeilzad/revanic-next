// src/app/api/publications/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

// تابعی برای ساختن اسلاگ (slug) تمیز از نام نشریه
function createSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/\s+/g, "-") // جایگزینی فاصله‌ها با خط تیره
        .replace(/[^\w\-]+/g, "") // حذف کاراکترهای نامعتبر
        .replace(/\-\-+/g, "-") // جایگزینی چند خط تیره با یکی
        .replace(/^-+/, "") // حذف خط تیره از ابتدا
        .replace(/-+$/, ""); // حذف خط تیره از انتها
}

export async function POST(req: Request) {
    const token = cookies().get("token")?.value;
    if (!token) {
        return new NextResponse("Authentication token not found", { status: 401 });
    }

    try {
        // 1. احراز هویت و دریافت اطلاعات کاربر
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        const userId = payload.userId as number;

        if (!userId) {
            return new NextResponse("Invalid token payload", { status: 401 });
        }

        // 2. دریافت و اعتبارسنجی داده‌های ورودی
        const { name, description } = await req.json();
        if (!name || name.length < 3) {
            return NextResponse.json(
                { error: "Name is required and must be at least 3 characters long." },
                { status: 400 }
            );
        }

        // 3. ایجاد اسلاگ و بررسی عدم تکراری بودن آن
        let slug = createSlug(name);
        const existingPublication = await prisma.publication.findUnique({
            where: { slug },
        });

        if (existingPublication) {
            // اگر اسلاگ تکراری بود، یک عدد تصادفی به انتهای آن اضافه کن
            slug = `${slug}-${Math.floor(Math.random() * 1000)}`;
        }

        // 4. ایجاد نشریه و اتصال کاربر به آن به عنوان مالک (OWNER)
        const newPublication = await prisma.publication.create({
            data: {
                name,
                slug,
                description,
                // ایجاد رکورد در جدول واسط UsersOnPublications
                members: {
                    create: {
                        userId: userId,
                        role: "OWNER", // نقش کاربر به عنوان مالک تعیین می‌شود
                    },
                },
            },
            include: {
                members: true, // بازگرداندن اطلاعات اعضا برای اطمینان
            },
        });

        return NextResponse.json(newPublication, { status: 201 });

    } catch (error) {
        console.error("CREATE_PUBLICATION_ERROR", error);
        // @ts-ignore
        if (error.code === 'P2002') { // خطای ইউনিক بودن دیتابیس
            return NextResponse.json({ error: "A publication with this name already exists." }, { status: 409 });
        }
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}