// src/app/authors/page.tsx
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify, JWTPayload } from "jose";
import Link from "next/link";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FollowButton } from "@/components/FollowButton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const AUTHORS_PER_PAGE = 9;

interface JwtPayload extends JWTPayload {
  userId: number;
}

type AuthorsPageProps = {
  searchParams?: {
    search?: string | string[];
    page?: string | string[];
  };
};

const buildPageHref = (page: number, searchQuery: string) => {
  const params = new URLSearchParams();
  if (searchQuery) {
    params.set("search", searchQuery);
  }
  if (page > 1) {
    params.set("page", page.toString());
  }
  const query = params.toString();
  return query ? `/authors?${query}` : "/authors";
};

const formatNumber = (value: number) => new Intl.NumberFormat("fa-IR").format(value < 0 ? 0 : value);

export const dynamic = "force-dynamic";

const AuthorsPage = async ({ searchParams }: AuthorsPageProps) => {
  const rawSearch = searchParams?.search;
  const rawPage = searchParams?.page;

  const searchQuery =
    typeof rawSearch === "string"
      ? rawSearch.trim()
      : Array.isArray(rawSearch) && rawSearch.length > 0
        ? rawSearch[0].trim()
        : "";

  const initialPage =
    typeof rawPage === "string"
      ? parseInt(rawPage, 10)
      : Array.isArray(rawPage) && rawPage.length > 0
        ? parseInt(rawPage[0], 10)
        : 1;

  const page = Number.isFinite(initialPage) && initialPage > 0 ? initialPage : 1;

  const where = searchQuery
    ? {
        name: {
          contains: searchQuery,
          mode: "insensitive" as const,
        },
      }
    : {};

  const totalAuthors = await prisma.user.count({ where });
  const totalPages = Math.max(Math.ceil(totalAuthors / AUTHORS_PER_PAGE), 1);
  const currentPage = Math.min(page, totalPages);
  const skip = (currentPage - 1) * AUTHORS_PER_PAGE;

  const authorRecords = await prisma.user.findMany({
    where,
    skip,
    take: AUTHORS_PER_PAGE,
    orderBy: {
      followers: {
        _count: "desc",
      },
    },
    include: {
      articles: {
        where: { status: "APPROVED" },
        select: { id: true },
      },
      _count: {
        select: {
          followers: true,
        },
      },
    },
  });

  const authors = authorRecords.map((author) => {
    const displayName = (author.name ?? "").trim() || "نویسنده ناشناس";
    return {
      id: author.id,
      name: displayName,
      initials: displayName.charAt(0),
      articleCount: author.articles.length,
      followerCount: author._count.followers,
    };
  });

  const token = cookies().get("token")?.value;
  let followingIds = new Set<number>();

  if (token && authors.length > 0) {
    try {
      const secretKey = process.env.JWT_SECRET;
      if (!secretKey) {
        throw new Error("JWT_SECRET is not configured");
      }
      const secret = new TextEncoder().encode(secretKey);
      const { payload } = await jwtVerify(token, secret);
      const currentUserId = (payload as JwtPayload).userId;

      if (currentUserId) {
        const followRecords = await prisma.follow.findMany({
          where: {
            followerId: currentUserId,
            followingId: { in: authors.map((author) => author.id) },
          },
          select: { followingId: true },
        });
        followingIds = new Set(followRecords.map((record) => record.followingId));
      }
    } catch (error) {
      console.error("AUTHORS_FOLLOW_LOOKUP_FAILED", error);
    }
  }

  const hasResults = authors.length > 0;
  const pageLinks = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <div className="min-h-screen bg-background">
      <section className="py-16 bg-journal-cream/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-journal mb-4">نویسندگان مجله روانک</h1>
            <p className="text-xl text-journal-light mb-8">آشنایی با نویسندگان و متخصصان حوزه‌های مختلف</p>
            <form className="relative max-w-lg mx-auto" action="/authors" method="get">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-journal-light" />
              <Input
                name="search"
                placeholder="جستجوی نویسندگان..."
                defaultValue={searchQuery}
                className="pr-10 h-12 border-journal-green/20"
                aria-label="جستجوی نویسنده"
              />
            </form>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {hasResults ? (
              <>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {authors.map((author) => (
                    <Card key={author.id} className="group border-0 shadow-soft transition-all duration-300 hover:shadow-medium">
                      <CardContent className="p-6">
                        <div className="text-center">
                          <Avatar className="mx-auto mb-4 h-20 w-20">
                            <AvatarFallback className="bg-journal-green text-xl text-white">
                              {author.initials}
                            </AvatarFallback>
                          </Avatar>
                          <Link href={`/authors/${author.id}`}>
                            <h3 className="mb-2 font-bold text-lg text-journal transition-colors group-hover:text-journal-green">
                              {author.name}
                            </h3>
                          </Link>
                          <div className="my-4 flex justify-around text-sm text-journal-light">
                            <div className="text-center">
                              <div className="font-semibold text-journal">{formatNumber(author.followerCount)}</div>
                              <div>دنبال‌کننده</div>
                            </div>
                            <div className="text-center">
                              <div className="font-semibold text-journal">{formatNumber(author.articleCount)}</div>
                              <div>مقاله</div>
                            </div>
                          </div>
                          <FollowButton targetUserId={author.id} initialFollowing={followingIds.has(author.id)} />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-12">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            href={buildPageHref(Math.max(currentPage - 1, 1), searchQuery)}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                            aria-disabled={currentPage === 1}
                          />
                        </PaginationItem>
                        {pageLinks.map((pageNumber) => (
                          <PaginationItem key={pageNumber}>
                            <PaginationLink
                              href={buildPageHref(pageNumber, searchQuery)}
                              isActive={pageNumber === currentPage}
                            >
                              {pageNumber}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext
                            href={buildPageHref(Math.min(currentPage + 1, totalPages), searchQuery)}
                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                            aria-disabled={currentPage === totalPages}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            ) : (
              <div className="py-12 text-center">
                <p className="text-lg text-journal-light">هیچ نویسنده‌ای یافت نشد.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AuthorsPage;
