
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search');

  
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "9", 10); 
  const skip = (page - 1) * limit;

  const where: any = {};

  if (search) {
    where.name = {
      contains: search,
      mode: 'insensitive',
    };
  }

  try {
    const users = await prisma.user.findMany({
      where,
      skip,
      take: limit,
      include: {
        _count: {
          select: {
            followers: true,
            articles: { where: { status: 'APPROVED' } }
          }
        },
      },
      orderBy: {
        followers: {
          _count: 'desc'
        }
      }
    });

    const totalUsers = await prisma.user.count({ where });
    const totalPages = Math.ceil(totalUsers / limit);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        totalUsers,
        totalPages,
      }
    });
  } catch (error) {
    console.error("GET_USERS_ERROR", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}