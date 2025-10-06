// src/components/AdminSeriesTab.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { faIR } from 'date-fns/locale';
import { Loader2, Plus, Search, Trash2 } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

const SERIES_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'پیش‌نویس',
  PUBLISHED: 'منتشر شده',
  ARCHIVED: 'آرشیو شده',
};

interface AdminSeriesArticle {
  id: number;
  order: number;
  releaseAt: string | null;
  releasedAt: string | null;
  notifiedAt: string | null;
  article: {
    id: number;
    title: string;
    status: string;
    readTimeMinutes: number | null;
    createdAt: string;
  };
}

interface AdminSeries {
  id: number;
  title: string;
  slug: string;
  subtitle?: string | null;
  description?: string | null;
  coverImageUrl?: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  curator?: { id: number; name: string | null } | null;
  _count?: { articles: number; followers: number };
  articles: AdminSeriesArticle[];
}

interface AdminArticleOption {
  id: number;
  title: string;
  createdAt: string;
  status: string;
}

type SeriesFormState = {
  title: string;
  slug: string;
  subtitle: string;
  description: string;
  coverImageUrl: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
};

const initialSeriesForm: SeriesFormState = {
  title: '',
  slug: '',
  subtitle: '',
  description: '',
  coverImageUrl: '',
  status: 'DRAFT',
};

const persianFormatter = new Intl.NumberFormat('fa-IR');
const dateTimeFormatter = new Intl.DateTimeFormat('fa-IR', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function formatReleaseAt(value?: string | null) {
  if (!value) return '—';
  try {
    return dateTimeFormatter.format(new Date(value));
  } catch (error) {
    return '—';
  }
}

const fetchSeries = async (): Promise<AdminSeries[]> => {
  const response = await fetch('/api/admin/series');
  if (!response.ok) {
    throw new Error('خطا در دریافت لیست سری‌ها.');
  }
  return response.json();
};

const fetchAvailableArticles = async (search: string): Promise<AdminArticleOption[]> => {
  const params = new URLSearchParams();
  if (search.trim()) {
    params.set('search', search.trim());
  }
  params.set('take', '20');

  const response = await fetch(`/api/admin/series/articles?${params.toString()}`);
  if (!response.ok) {
    throw new Error('خطا در دریافت لیست مقالات.');
  }
  return response.json();
};

const createSeries = async (payload: {
  title: string;
  slug: string;
  subtitle?: string | null;
  description?: string | null;
  coverImageUrl?: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}) => {
  const response = await fetch('/api/admin/series', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || 'خطا در ایجاد سری جدید.');
  }

  return response.json();
};

const assignSeriesArticle = async (
  seriesId: number,
  payload: { articleId: number; order: number; releaseAt?: string | null }
) => {
  const response = await fetch(`/api/admin/series/${seriesId}/articles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || 'خطا در افزودن مقاله به سری.');
  }

  return response.json();
};

const removeSeriesArticle = async (seriesId: number, seriesArticleId: number) => {
  const response = await fetch(`/api/admin/series/${seriesId}/articles`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ seriesArticleId }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || 'خطا در حذف مقاله از سری.');
  }

  return response.json();
};

const deleteSeries = async (seriesId: number) => {
  const response = await fetch('/api/admin/series', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: seriesId }),
  });

  if (response.status === 204) {
    return true;
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || 'حذف سری با خطا مواجه شد.');
  }

  return true;
};

interface SeriesItemProps {
  series: AdminSeries;
}

const SeriesItem = ({ series }: SeriesItemProps) => {
  const queryClient = useQueryClient();
  const [articleSearch, setArticleSearch] = useState('');
  const [selectedArticleId, setSelectedArticleId] = useState<number | null>(null);
  const [order, setOrder] = useState<string>(String(series.articles.length + 1));
  const [releaseAt, setReleaseAt] = useState<string>('');

  useEffect(() => {
    setOrder(String(series.articles.length + 1));
  }, [series.articles.length]);

  const {
    data: availableArticles = [],
    isFetching: isFetchingArticles,
    isError: isArticlesError,
  } = useQuery<AdminArticleOption[]>({
    queryKey: ['admin-series-available-articles', articleSearch],
    queryFn: () => fetchAvailableArticles(articleSearch),
  });

  const assignMutation = useMutation({
    mutationFn: ({ articleId, orderNumber, release }: { articleId: number; orderNumber: number; release?: string | null }) =>
      assignSeriesArticle(series.id, {
        articleId,
        order: orderNumber,
        releaseAt: release ?? null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-series'] });
      setSelectedArticleId(null);
      setOrder(String(series.articles.length + 2));
      setReleaseAt('');
    },
    onError: (error: any) => {
      alert(error?.message || 'خطایی رخ داد.');
    },
  });

  const removeMutation = useMutation({
    mutationFn: (seriesArticleId: number) => removeSeriesArticle(series.id, seriesArticleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-series'] });
    },
    onError: (error: any) => {
      alert(error?.message || 'خطا در حذف مقاله.');
    },
  });

  const deleteSeriesMutation = useMutation({
    mutationFn: () => deleteSeries(series.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-series'] });
      alert('سری با موفقیت حذف شد.');
    },
    onError: (error: any) => {
      alert(error?.message || 'حذف سری با مشکل مواجه شد.');
    },
  });

  const articleCount = series._count?.articles ?? series.articles.length;
  const followerCount = series._count?.followers ?? 0;

  const selectedArticle = useMemo(
    () => availableArticles.find((item) => item.id === selectedArticleId) || null,
    [availableArticles, selectedArticleId]
  );

  const handleAssign = () => {
    if (!selectedArticleId) {
      alert('ابتدا یک مقاله را انتخاب کنید.');
      return;
    }
    const orderNumber = Number(order);
    if (!Number.isInteger(orderNumber) || orderNumber <= 0) {
      alert('ترتیب باید یک عدد صحیح مثبت باشد.');
      return;
    }

    assignMutation.mutate({
      articleId: selectedArticleId,
      orderNumber,
      release: releaseAt ? new Date(releaseAt).toISOString() : null,
    });
  };

  const handleDeleteSeries = () => {
    if (!window.confirm(`آیا از حذف سری «${series.title}» اطمینان دارید؟`)) {
      return;
    }
    deleteSeriesMutation.mutate();
  };

  return (
    <Card key={series.id} className="border-journal-cream bg-white/70">
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-xl text-journal">{series.title}</CardTitle>
            <CardDescription className="text-sm text-journal-light">
              اسلاگ: <code className="mx-1 rounded bg-journal-cream px-1 py-0.5 text-xs">{series.slug}</code>
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={series.status === 'PUBLISHED' ? 'default' : series.status === 'DRAFT' ? 'secondary' : 'outline'}>
              {SERIES_STATUS_LABELS[series.status] || series.status}
            </Badge>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteSeries}
              disabled={deleteSeriesMutation.isPending}
            >
              <Trash2 className="ml-2 h-4 w-4" />
              حذف سری
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 text-xs text-journal-light">
          <span>تعداد مقالات: {persianFormatter.format(articleCount)}</span>
          <span>دنبال‌کننده: {persianFormatter.format(followerCount)}</span>
          {series.curator?.name ? <span>منتخب {series.curator.name}</span> : null}
        </div>
        {series.description ? (
          <p className="text-sm leading-relaxed text-journal-light/90">{series.description}</p>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16 text-center">#</TableHead>
                <TableHead>عنوان مقاله</TableHead>
                <TableHead className="hidden sm:table-cell">وضعیت</TableHead>
                <TableHead className="hidden md:table-cell">زمان انتشار</TableHead>
                <TableHead className="hidden md:table-cell">زمان مطالعه</TableHead>
                <TableHead className="w-16 text-center">حذف</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {series.articles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-6 text-center text-sm text-journal-light">
                    هنوز مقاله‌ای به این سری اضافه نشده است.
                  </TableCell>
                </TableRow>
              ) : (
                series.articles.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-center font-semibold text-journal">{persianFormatter.format(item.order)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-journal">{item.article.title}</span>
                        <span className="text-xs text-journal-light">شناسه: {persianFormatter.format(item.article.id)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-journal-light">
                      {item.article.status === 'APPROVED' ? 'تایید شده' : item.article.status}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-journal-light">
                      {item.releasedAt ? (
                        <div className="space-y-1">
                          <span className="text-green-600">
                            منتشر شده {formatReleaseAt(item.releasedAt)}
                          </span>
                          {item.notifiedAt ? (
                            <span className="block text-xs text-muted-foreground">
                              اعلان ارسال شده: {formatReleaseAt(item.notifiedAt)}
                            </span>
                          ) : null}
                        </div>
                      ) : item.releaseAt ? (
                        <span>
                          زمان‌بندی: {formatReleaseAt(item.releaseAt)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">آماده انتشار</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-journal-light">
                      {persianFormatter.format(item.article.readTimeMinutes ?? 0)} دقیقه
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeMutation.mutate(item.id)}
                        disabled={removeMutation.isPending}
                        aria-label="حذف مقاله از سری"
                      >
                        {removeMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-red-500" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="space-y-4 rounded-md border border-dashed border-journal-cream p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-journal">
            <Plus className="h-4 w-4" />
            افزودن مقاله جدید به سری
          </div>
          <div className="space-y-3">
            <label className="text-xs text-journal-light">جستجوی مقاله تایید شده</label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-journal-light" />
                <Input
                  value={articleSearch}
                  onChange={(event) => setArticleSearch(event.target.value)}
                  placeholder="عنوان مقاله را وارد کنید"
                  className="pr-9"
                />
              </div>
              <Button
                variant="outline"
                type="button"
                onClick={() => setArticleSearch('')}
                disabled={!articleSearch}
              >
                پاک کردن جستجو
              </Button>
            </div>
            <div className="max-h-48 overflow-y-auto rounded-md border">
              {isArticlesError ? (
                <div className="p-4 text-sm text-red-500">خطا در دریافت لیست مقالات.</div>
              ) : isFetchingArticles ? (
                <div className="flex items-center gap-2 p-4 text-sm text-journal-light">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  در حال بارگذاری...
                </div>
              ) : availableArticles.length === 0 ? (
                <div className="p-4 text-sm text-journal-light">مقاله‌ای یافت نشد.</div>
              ) : (
                <ul className="divide-y divide-journal-cream/70">
                  {availableArticles.map((article) => {
                    const isSelected = selectedArticleId === article.id;
                    return (
                      <li key={article.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedArticleId(article.id)}
                          className={`flex w-full flex-col items-start gap-1 px-4 py-3 text-right transition ${
                            isSelected ? 'bg-journal-cream/80' : 'hover:bg-journal-cream/60'
                          }`}
                        >
                          <span className="text-sm font-medium text-journal">{article.title}</span>
                          <span className="text-[11px] text-journal-light">
                            شناسه: {persianFormatter.format(article.id)} • وضعیت: {article.status === 'APPROVED' ? 'تایید شده' : article.status}
                          </span>
                          <span className="text-[11px] text-journal-light">
                            تاریخ ایجاد: {format(new Date(article.createdAt), 'yyyy/MM/dd', { locale: faIR })}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {selectedArticle ? (
            <div className="rounded-md bg-journal-cream/40 p-3 text-xs text-journal">
              مقاله انتخابی: «{selectedArticle.title}» (شناسه {persianFormatter.format(selectedArticle.id)})
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs text-journal-light">ترتیب نمایش</label>
              <Input
                type="number"
                min={1}
                value={order}
                onChange={(event) => setOrder(event.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-journal-light">تاریخ انتشار (اختیاری)</label>
              <Input
                type="datetime-local"
                value={releaseAt}
                onChange={(event) => setReleaseAt(event.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              onClick={handleAssign}
              disabled={assignMutation.isPending}
            >
              {assignMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  در حال افزودن...
                </>
              ) : (
                'افزودن به سری'
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const AdminSeriesTab = () => {
  const queryClient = useQueryClient();
  const [formState, setFormState] = useState<SeriesFormState>(initialSeriesForm);

  const { data: series = [], isLoading, isError } = useQuery<AdminSeries[]>({
    queryKey: ['admin-series'],
    queryFn: fetchSeries,
  });

  const createMutation = useMutation({
    mutationFn: createSeries,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-series'] });
      setFormState(initialSeriesForm);
      alert('سری جدید با موفقیت ایجاد شد.');
    },
    onError: (error: any) => {
      alert(error?.message || 'خطا در ایجاد سری.');
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const title = formState.title.trim();
    const slug = formState.slug.trim();

    if (!title || !slug) {
      alert('عنوان و اسلاگ سری الزامی هستند.');
      return;
    }

    createMutation.mutate({
      title,
      slug,
      subtitle: formState.subtitle.trim() ? formState.subtitle.trim() : null,
      description: formState.description.trim() ? formState.description.trim() : null,
      coverImageUrl: formState.coverImageUrl.trim() ? formState.coverImageUrl.trim() : null,
      status: formState.status,
    });
  };

  return (
    <div className="space-y-6">
      <Card className="border-journal-cream bg-white/80">
        <CardHeader>
          <CardTitle className="text-2xl text-journal">ایجاد سری جدید</CardTitle>
          <CardDescription className="text-sm text-journal-light">
            از این فرم برای ایجاد مجموعه‌های دنباله‌دار استفاده کنید و سپس مقالات تایید شده را به آن اضافه نمایید.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-journal-light">عنوان سری *</label>
                <Input
                  value={formState.title}
                  onChange={(event) => setFormState((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="مانند: مسیر یادگیری هوش مصنوعی"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-journal-light">اسلاگ *</label>
                <Input
                  value={formState.slug}
                  onChange={(event) => setFormState((prev) => ({ ...prev, slug: event.target.value }))}
                  placeholder="ai-learning-path"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-journal-light">زیرعنوان (اختیاری)</label>
                <Input
                  value={formState.subtitle}
                  onChange={(event) => setFormState((prev) => ({ ...prev, subtitle: event.target.value }))}
                  placeholder="توضیح کوتاه در مورد سری"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-journal-light">وضعیت</label>
                <Select
                  value={formState.status}
                  onValueChange={(value: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED') =>
                    setFormState((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب وضعیت" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">پیش‌نویس</SelectItem>
                    <SelectItem value="PUBLISHED">منتشر شده</SelectItem>
                    <SelectItem value="ARCHIVED">آرشیو شده</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs text-journal-light">تصویر کاور (اختیاری)</label>
              <Input
                value={formState.coverImageUrl}
                onChange={(event) => setFormState((prev) => ({ ...prev, coverImageUrl: event.target.value }))}
                placeholder="آدرس کاور سری"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-journal-light">توضیحات (اختیاری)</label>
              <Textarea
                value={formState.description}
                onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="توضیح کامل‌تر درباره مسیر و هدف این سری"
                className="min-h-[120px]"
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    در حال ایجاد...
                  </>
                ) : (
                  'ایجاد سری'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-journal">مدیریت سری‌های موجود</h2>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : isError ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            خطا در دریافت لیست سری‌ها. لطفاً بعداً تلاش کنید.
          </div>
        ) : series.length === 0 ? (
          <div className="rounded-md border border-dashed border-journal-cream p-6 text-center text-sm text-journal-light">
            هنوز سری‌ای ایجاد نشده است. ابتدا یک سری بسازید و سپس مقالات را به آن اضافه کنید.
          </div>
        ) : (
          <div className="space-y-6">
            {series.map((item) => (
              <SeriesItem key={item.id} series={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
