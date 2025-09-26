// src/app/api/publications/[slug]/members/[userId]/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

async function isOwner(userId: number, slug: string): Promise<boolean> {
    const publication = await prisma.publication.findUnique({
        where: { slug },
        include: { members: { where: { userId, role: 'OWNER' } } },
    });
    return !!publication?.members.length;
}

export async function DELETE(
    req: Request,
    { params }: { params: { slug: string; userId: string } }
) {
    const token = cookies().get("token")?.value;
    if (!token) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const { slug, userId: userIdToRemoveStr } = params;
        const userIdToRemove = parseInt(userIdToRemoveStr, 10);

        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        const currentUserId = payload.userId as number;

        if (!(await isOwner(currentUserId, slug))) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        if (currentUserId === userIdToRemove) {
            return NextResponse.json({ error: "شما نمی‌توانید خودتان را حذف کنید." }, { status: 400 });
        }

        const publication = await prisma.publication.findUnique({ where: { slug } });
        if (!publication) return new NextResponse("Not Found", { status: 404 });

        await prisma.usersOnPublications.delete({
            where: {
                userId_publicationId: {
                    userId: userIdToRemove,
                    publicationId: publication.id,
                }
            }
        });

        return new NextResponse(null, { status: 204 });

    } catch (error) {
        console.error("REMOVE_MEMBER_ERROR", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}