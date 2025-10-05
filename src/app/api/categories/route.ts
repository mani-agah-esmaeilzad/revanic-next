// src/app/api/categories/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureDefaultCategories } from '@/lib/categories';

export async function GET() {
    try {
        await ensureDefaultCategories();
        const categories = await prisma.category.findMany({
            orderBy: {
                name: 'asc',
            },
        });
        return NextResponse.json(categories);
    } catch (error) {
        console.error('GET_CATEGORIES_ERROR', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}