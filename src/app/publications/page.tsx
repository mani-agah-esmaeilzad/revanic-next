// src/app/publications/page.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { PublicationCard } from '@/components/PublicationCard';
import { Skeleton } from '@/components/ui/skeleton';

interface Publication {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    avatarUrl: string | null;
    _count: {
        members: number;
        articles: number;
    };
}

// تابع برای دریافت لیست انتشارات از API
const fetchPublications = async (): Promise<Publication[]> => {
    const response = await fetch('/api/publications');
    if (!response.ok) {
        throw new Error('Failed to fetch publications');
    }
    return response.json();
};

const PublicationsPage = () => {
    const { data: publications, isLoading, isError } = useQuery<Publication[]>({
        queryKey: ['publications'],
        queryFn: fetchPublications,
    });

    return (
        <div className="min-h-screen bg-background">
            <section className="py-16 bg-muted/20">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto text-center">
                        <h1 className="text-4xl font-bold text-foreground mb-4">
                            انتشارات روانیک
                        </h1>
                        <p className="text-xl text-muted-foreground">
                            مجموعه‌ای از بهترین مجلات تخصصی فارسی را دنبال کنید.
                        </p>
                    </div>
                </div>
            </section>

            <section className="py-12">
                <div className="container mx-auto px-4">
                    <div className="max-w-6xl mx-auto">
                        {isLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[...Array(4)].map((_, i) => (
                                    <Skeleton key={i} className="h-48 w-full" />
                                ))}
                            </div>
                        ) : isError ? (
                            <div className="text-center py-12">
                                <p className="text-destructive text-lg">
                                    خطا در دریافت اطلاعات. لطفاً دوباره تلاش کنید.
                                </p>
                            </div>
                        ) : publications && publications.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {publications.map((pub) => (
                                    <PublicationCard
                                        key={pub.id}
                                        name={pub.name}
                                        slug={pub.slug}
                                        description={pub.description}
                                        avatarUrl={pub.avatarUrl}
                                        membersCount={pub._count.members}
                                        articlesCount={pub._count.articles}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <p className="text-muted-foreground text-lg">
                                    هنوز هیچ انتشاراتی ثبت نشده است.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default PublicationsPage;