
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    req: Request,
    { params }: { params: { slug: string } }
) {
    try {
        const slug = params.slug;

        const publication = await prisma.publication.findUnique({
            where: { slug },
            include: {
                _count: {
                    select: { members: true },
                },
                articles: {
                    where: { status: 'APPROVED' },
                    orderBy: { createdAt: 'desc' },
                    include: {
                        author: { select: { name: true } },
                        _count: { select: { claps: true, comments: true } },
                        categories: { select: { name: true } },
                    },
                },
            },
        });

        if (!publication) {
            return new NextResponse('Publication not found', { status: 404 });
        }

        return NextResponse.json(publication);
    } catch (error) {
        console.error('GET_PUBLICATION_ERROR', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}