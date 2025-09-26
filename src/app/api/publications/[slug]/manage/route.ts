// src/app/api/publications/[slug]/manage/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

export async function GET(
    req: Request,
    { params }: { params: { slug: string } }
) {
    const token = cookies().get("token")?.value;
    if (!token) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { slug } = params;
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        const currentUserId = payload.userId as number;

        const publication = await prisma.publication.findUnique({
            where: { slug },
            include: {
                members: {
                    where: {
                        userId: currentUserId,
                        role: "OWNER",
                    },
                },
            },
        });

        // اگر کاربر فعلی عضو این نشریه با نقش OWNER نباشد، دسترسی را رد کن
        if (!publication || publication.members.length === 0) {
            return new NextResponse("Forbidden: You are not the owner of this publication.", { status: 403 });
        }

        // اگر دسترسی تایید شد، تمام اطلاعات را برگردان
        const publicationDetails = await prisma.publication.findUnique({
            where: { slug },
            include: {
                members: {
                    include: {
                        user: {
                            select: { id: true, name: true, avatarUrl: true }
                        }
                    },
                    orderBy: { role: 'asc' } // OWNER ها اول نمایش داده شوند
                }
            }
        });

        return NextResponse.json(publicationDetails);
    } catch (error) {
        console.error("MANAGE_PUBLICATION_ERROR", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}