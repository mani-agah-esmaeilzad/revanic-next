// src/app/publications/[slug]/page.tsx
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, FileText } from 'lucide-react';
import ArticleCard from '@/components/ArticleCard';

// این تابع برای تولید متادیتای صفحه (عنوان و توضیحات) استفاده می‌شود
export async function generateMetadata({ params }: { params: { slug: string } }) {
    const publication = await prisma.publication.findUnique({
        where: { slug: params.slug },
    });

    if (!publication) {
        return {
            title: 'انتشارات یافت نشد',
        };
    }

    return {
        title: `${publication.name} | انتشارات روانیک`,
        description: publication.description,
    };
}

const PublicationProfilePage = async ({ params }: { params: { slug: string } }) => {
    const publication = await prisma.publication.findUnique({
        where: { slug: params.slug },
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
        notFound(); // اگر انتشارات پیدا نشد، صفحه 404 نمایش داده می‌شود
    }

    return (
        <div className="min-h-screen bg-background">
            {/* هدر صفحه پروفایل */}
            <section className="py-20 bg-muted/30 border-b">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto flex flex-col items-center text-center gap-4">
                        <Avatar className="h-24 w-24 border">
                            <AvatarImage src={publication.avatarUrl || undefined} alt={publication.name} />
                            <AvatarFallback className="bg-muted text-muted-foreground text-3xl">
                                {publication.name.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <h1 className="text-4xl font-bold text-foreground">
                            {publication.name}
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-2xl">
                            {publication.description || 'توضیحاتی برای این انتشارات ثبت نشده است.'}
                        </p>
                        <div className="flex items-center gap-6 text-sm text-muted-foreground mt-2">
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                <span>{publication._count.members.toLocaleString('fa-IR')} عضو</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                <span>{publication.articles.length.toLocaleString('fa-IR')} مقاله</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* لیست مقالات */}
            <section className="py-12">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-2xl font-bold text-foreground mb-6">
                            آخرین مقالات
                        </h2>
                        {publication.articles.length > 0 ? (
                            <div className="space-y-6">
                                {publication.articles.map((article) => (
                                    <ArticleCard
                                        key={article.id}
                                        id={article.id.toString()}
                                        title={article.title}
                                        excerpt={article.content.substring(0, 150) + "..."}
                                        image={article.coverImageUrl}
                                        author={{ name: article.author.name || "ناشناس" }}
                                        readTime={Math.ceil(article.content.length / 1000)}
                                        publishDate={new Intl.DateTimeFormat("fa-IR").format(new Date(article.createdAt))}
                                        claps={article._count.claps}
                                        comments={article._count.comments}
                                        category={article.categories[0]?.name || "عمومی"}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 border rounded-lg">
                                <p className="text-muted-foreground text-lg">
                                    هنوز هیچ مقاله‌ای در این انتشارات منتشر نشده است.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default PublicationProfilePage;