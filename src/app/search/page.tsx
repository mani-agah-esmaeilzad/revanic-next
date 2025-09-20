// src/app/search/page.tsx
'use client';
import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Search as SearchIcon } from 'lucide-react';
import ArticleCard from '@/components/ArticleCard';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

interface FetchedArticle {
    id: number;
    title: string;
    content: string;
    coverImageUrl: string | null;
    author: { name: string | null };
    createdAt: string;
    _count: { claps: number; comments: number }; // <-- اصلاح شد: از likes به claps
    categories: { name: string }[];
}

interface Author {
    id: number;
    name: string | null;
}

interface Category {
    id: number;
    name: string;
}

interface PaginationInfo {
    page: number;
    totalPages: number;
}

const SearchPage = () => {
    const [query, setQuery] = useState('');
    const [selectedAuthor, setSelectedAuthor] = useState('all');
    const [selectedCategory, setSelectedCategory] = useState('all');

    const [authors, setAuthors] = useState<Author[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);

    const [results, setResults] = useState<FetchedArticle[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);

    // Fetch authors and categories for filters
    useEffect(() => {
        const fetchFiltersData = async () => {
            try {
                const [authorsRes, categoriesRes] = await Promise.all([
                    fetch('/api/users'),
                    fetch('/api/categories')
                ]);
                if (authorsRes.ok) {
                    const data = await authorsRes.json();
                    setAuthors(data.users);
                }
                if (categoriesRes.ok) {
                    const data = await categoriesRes.json();
                    setCategories(data);
                }
            } catch (error) {
                console.error("Failed to fetch filter data:", error);
            }
        };
        fetchFiltersData();
    }, []);

    const performSearch = useCallback(async (page = 1) => {
        if (!query && selectedAuthor === 'all' && selectedCategory === 'all') {
            setResults([]);
            setHasSearched(true);
            setPagination(null);
            return;
        };

        setIsLoading(true);
        setHasSearched(true);
        const params = new URLSearchParams();
        if (query) params.append('q', query);
        if (selectedAuthor && selectedAuthor !== 'all') params.append('authorId', selectedAuthor);
        if (selectedCategory && selectedCategory !== 'all') params.append('categoryId', selectedCategory);
        params.append('page', String(page));

        try {
            const response = await fetch(`/api/search?${params.toString()}`);
            if (response.ok) {
                const data = await response.json();
                setResults(data.articles);
                setPagination(data.pagination);
            }
        } catch (error) {
            console.error("Search failed:", error);
        } finally {
            setIsLoading(false);
        }
    }, [query, selectedAuthor, selectedCategory]);

    const handlePageChange = (newPage: number) => {
        if (newPage > 0 && newPage <= (pagination?.totalPages || 1)) {
            performSearch(newPage);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <section className="py-16 bg-journal-cream/30">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto text-center">
                        <h1 className="text-4xl font-bold text-journal mb-4">جستجوی پیشرفته</h1>
                        <p className="text-xl text-journal-light mb-8">مقاله، نویسنده یا دسته‌بندی مورد نظر خود را بیابید</p>

                        <Card className="p-6 shadow-md border-0">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                <div className="md:col-span-2">
                                    <label className="text-right block mb-2 text-sm font-medium text-journal">جستجو برای...</label>
                                    <Input placeholder="کلمه کلیدی، عنوان و..." value={query} onChange={e => setQuery(e.target.value)} />
                                </div>
                                <div>
                                    <label className="text-right block mb-2 text-sm font-medium text-journal">نویسنده</label>
                                    <Select value={selectedAuthor} onValueChange={setSelectedAuthor}>
                                        <SelectTrigger><SelectValue placeholder="همه" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">همه</SelectItem>
                                            {authors.map(author => author.name && <SelectItem key={author.id} value={String(author.id)}>{author.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="text-right block mb-2 text-sm font-medium text-journal">دسته‌بندی</label>
                                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                        <SelectTrigger><SelectValue placeholder="همه" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">همه</SelectItem>
                                            {categories.map(cat => <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <Button onClick={() => performSearch(1)} className="w-full mt-4 bg-journal-green hover:bg-journal-green/90">
                                <SearchIcon className="h-4 w-4 ml-2" />
                                جستجو
                            </Button>
                        </Card>
                    </div>
                </div>
            </section>

            <section className="py-12">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        {isLoading ? (
                            <div className="space-y-4">
                                <Skeleton className="h-32 w-full" />
                                <Skeleton className="h-32 w-full" />
                                <Skeleton className="h-32 w-full" />
                            </div>
                        ) : hasSearched ? (
                            results.length > 0 ? (
                                <>
                                    <h2 className="text-2xl font-bold text-journal mb-6">نتایج جستجو</h2>
                                    <div className="space-y-6">
                                        {results.map(article => (
                                            <ArticleCard
                                                key={article.id}
                                                id={String(article.id)}
                                                title={article.title}
                                                excerpt={article.content.substring(0, 150) + "..."}
                                                author={{ name: article.author.name || "ناشناس" }} // <-- اصلاح شد
                                                readTime={5}
                                                publishDate={new Intl.DateTimeFormat('fa-IR').format(new Date(article.createdAt))}
                                                claps={article._count.claps} // <-- اصلاح شد
                                                comments={article._count.comments}
                                                category={article.categories[0]?.name || ''}
                                                image={article.coverImageUrl}
                                            />
                                        ))}
                                    </div>
                                    {pagination && pagination.totalPages > 1 && (
                                        <div className="mt-12">
                                            <Pagination>
                                                <PaginationContent>
                                                    <PaginationItem><PaginationPrevious onClick={() => handlePageChange(pagination.page - 1)} /></PaginationItem>
                                                    {[...Array(pagination.totalPages)].map((_, i) => (
                                                        <PaginationItem key={i}><PaginationLink isActive={pagination.page === i + 1} onClick={() => handlePageChange(i + 1)}>{i + 1}</PaginationLink></PaginationItem>
                                                    ))}
                                                    <PaginationItem><PaginationNext onClick={() => handlePageChange(pagination.page + 1)} /></PaginationItem>
                                                </PaginationContent>
                                            </Pagination>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <p className="text-center text-journal-light py-12">نتیجه‌ای برای جستجوی شما یافت نشد.</p>
                            )
                        ) : (
                            <p className="text-center text-journal-light py-12">برای مشاهده نتایج، لطفاً جستجو کنید.</p>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default SearchPage;