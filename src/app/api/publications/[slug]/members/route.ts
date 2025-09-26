// src/app/api/publications/[slug]/members/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

// تابع کمکی برای بررسی مالکیت
async function isOwner(userId: number, slug: string): Promise<boolean> {
    const publication = await prisma.publication.findUnique({
        where: { slug },
        include: { members: { where: { userId, role: 'OWNER' } } },
    });
    return publication?.members.length === 1;
}

export async function POST(
    req: Request,
    { params }: { params: { slug: string } }
) {
    const token = cookies().get("token")?.value;
    if (!token) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const { slug } = params;
        const { email } = await req.json();

        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        const currentUserId = payload.userId as number;

        if (!(await isOwner(currentUserId, slug))) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const userToInvite = await prisma.user.findUnique({ where: { email } });
        if (!userToInvite) {
            return NextResponse.json({ error: "کاربری با این ایمیل یافت نشد." }, { status: 404 });
        }

        const publication = await prisma.publication.findUnique({ where: { slug } });
        if (!publication) {
            return new NextResponse("Publication not found", { status: 404 });
        }

        // کاربر را به نشریه اضافه کن
        await prisma.usersOnPublications.create({
            data: {
                publicationId: publication.id,
                userId: userToInvite.id,
                role: 'WRITER' // نقش پیش‌فرض نویسنده است
            }
        });

        return NextResponse.json({ message: "User invited successfully." }, { status: 201 });

    } catch (error) {
        console.error("INVITE_MEMBER_ERROR", error);
        // @ts-ignore
        if (error.code === 'P2002') { // کاربر از قبل عضو است
            return NextResponse.json({ error: "این کاربر از قبل عضو نشریه است." }, { status: 409 });
        }
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}