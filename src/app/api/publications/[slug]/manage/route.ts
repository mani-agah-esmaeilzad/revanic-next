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

        // First, check if the user is the owner.
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

        // If the query returns no members, it means the current user is not the owner.
        if (!publication || publication.members.length === 0) {
            return new NextResponse("Forbidden: You are not the owner of this publication.", { status: 403 });
        }

        // If ownership is confirmed, fetch the full details.
        const publicationDetails = await prisma.publication.findUnique({
            where: { slug },
            select: {
                id: true,
                name: true,
                members: {
                    select: {
                        role: true,
                        user: {
                            select: { id: true, name: true, avatarUrl: true }
                        }
                    },
                    orderBy: { role: 'asc' } // Show OWNER first
                }
            }
        });

        return NextResponse.json(publicationDetails);
    } catch (error) {
        console.error("MANAGE_PUBLICATION_ERROR", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}