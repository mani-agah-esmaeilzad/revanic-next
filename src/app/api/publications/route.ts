// src/app/api/publications/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// اسکیمای اعتبارسنجی برای ایجاد یک انتشارات جدید
const createPublicationSchema = z.object({
    name: z.string().min(3, 'نام انتشارات باید حداقل ۳ کاراکتر باشد.').max(100),
    description: z.string().max(500, 'توضیحات نمی‌تواند بیشتر از ۵۰۰ کاراکتر باشد.').optional(),
});

// GET: دریافت لیست تمام انتشارات
export async function GET() {
    try {
        const publications = await prisma.publication.findMany({
            include: {
                _count: {
                    select: { members: true, articles: true },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        return NextResponse.json(publications);
    } catch (error) {
        console.error('GET_PUBLICATIONS_ERROR', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}


// POST: ایجاد یک انتشارات جدید
export async function POST(req: Request) {
    const token = cookies().get('token')?.value;
    if (!token) {
        return new NextResponse('Authentication token not found', { status: 401 });
    }

    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        const userId = payload.userId as number;

        const body = await req.json();
        const validation = createPublicationSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ message: validation.error.errors.map(e => e.message).join(', ') }, { status: 400 });
        }

        const { name, description } = validation.data;

        // ایجاد یک slug منحصر به فرد و خوانا برای URL
        const slug = name.trim().replace(/\s+/g, '-').toLowerCase();

        const existingPublication = await prisma.publication.findFirst({
            where: { OR: [{ name }, { slug }] },
        });

        if (existingPublication) {
            return new NextResponse('انتشاراتی با این نام یا اسلاگ уже موجود است.', { status: 409 });
        }

        const newPublication = await prisma.publication.create({
            data: {
                name,
                slug,
                description,
                members: {
                    create: {
                        userId: userId,
                        role: 'OWNER', // کاربری که انتشارات را می‌سازد، مالک آن است
                    },
                },
            },
        });

        return NextResponse.json(newPublication, { status: 201 });

    } catch (error) {
        console.error('CREATE_PUBLICATION_ERROR', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}