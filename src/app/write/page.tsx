// src/app/write/page.tsx
"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from 'next/dynamic';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, Send, Loader2, Image as ImageIcon, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { TagInput } from "@/components/TagInput";
import Image from 'next/image';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ویرایشگر متن به صورت دینامیک لود می‌شود تا از خطای SSR جلوگیری شود
const Tiptap = dynamic(() => import('@/components/editor/Tiptap'), {
  ssr: false,
  loading: () => <Skeleton className="min-h-[400px] w-full" />,
});

interface Category {
  id: number;
  name: string;
}

const DRAFT_KEY = 'revanic_article_draft';

const WritePage = () => {
  const router = useRouter();
  const [articleId, setArticleId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState<"save" | "publish" | false>(false);
  const [message, setMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const isInitialLoad = useRef(true); // برای جلوگیری از ذخیره خودکار در بارگذاری اولیه

  // --- منطق ذخیره و بازیابی خودکار ---

  // 1. هنگام بارگذاری صفحه، چک کن آیا پیش‌نویس ذخیره شده‌ای وجود دارد
  useEffect(() => {
    if (isInitialLoad.current) {
      const savedDraft = localStorage.getItem(DRAFT_KEY);
      if (savedDraft) {
        setShowRestoreDialog(true);
      }
      isInitialLoad.current = false;
    }
  }, []);

  // 2. هر زمان عنوان یا محتوا تغییر کرد، آن را در localStorage ذخیره کن
  useEffect(() => {
    if (!isInitialLoad.current) {
      const draft = JSON.stringify({ title, content, coverImageUrl, categoryId, tags });
      localStorage.setItem(DRAFT_KEY, draft);
    }
  }, [title, content, coverImageUrl, categoryId, tags]);

  const handleRestore = () => {
    const savedDraft = localStorage.getItem(DRAFT_KEY);
    if (savedDraft) {
      const { title, content, coverImageUrl, categoryId, tags } = JSON.parse(savedDraft);
      setTitle(title);
      setContent(content);
      setCoverImageUrl(coverImageUrl);
      setCategoryId(categoryId);
      setTags(tags);
    }
    setShowRestoreDialog(false);
  };

  const handleDiscard = () => {
    localStorage.removeItem(DRAFT_KEY);
    setShowRestoreDialog(false);
  };

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };
    fetchCategories();
  }, []);

  const handleCoverImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setMessage(null);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setCoverImageUrl(data.url);
      } else {
        setMessage({ type: 'error', text: 'خطا در آپلود تصویر.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'خطای شبکه هنگام آپلود.' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (published: boolean) => {
    if (!title.trim()) {
      setMessage({ type: 'error', text: 'عنوان مقاله نمی‌تواند خالی باشد.' });
      return;
    }
    if (!content.trim() || content === '<p></p>') {
      setMessage({ type: 'error', text: 'محتوای مقاله نمی‌تواند خالی باشد.' });
      return;
    }

    setIsLoading(published ? "publish" : "save");
    setMessage(null);

    const isUpdating = articleId !== null;
    const url = isUpdating ? `/api/articles/${articleId}` : "/api/articles";
    const method = isUpdating ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          published,
          categoryIds: categoryId ? [parseInt(categoryId)] : [],
          tags,
          coverImageUrl,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        clearDraft(); // پاک کردن پیش‌نویس بعد از ارسال موفق
        if (published) {
          setMessage({ type: "success", text: "مقاله شما برای بازبینی ارسال شد." });
          setTimeout(() => router.push('/profile'), 2000);
        } else {
          setArticleId(result.id);
          setMessage({ type: "success", text: "پیش‌نویس با موفقیت ذخیره شد." });
        }
      } else {
        setMessage({ type: "error", text: result.message || "خطایی رخ داد." });
      }
    } catch (err) {
      setMessage({ type: "error", text: "خطای شبکه. لطفاً دوباره تلاش کنید." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>بازیابی پیش‌نویس ذخیره شده</AlertDialogTitle>
            <AlertDialogDescription>
              به نظر می‌رسد یک پیش‌نویس ناتمام دارید. آیا مایل به بازیابی آن هستید؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDiscard}>حذف پیش‌نویس</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestore}>بله، بازیابی کن</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-journal">نوشتن مقاله</h1>
                <p className="text-journal-light mt-2">
                  {articleId
                    ? `در حال ویرایش پیش‌نویس...`
                    : "داستان خود را با جهان به اشتراک بگذارید"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleSubmit(false)}
                  disabled={!!isLoading || isUploading}
                >
                  {isLoading === "save" ? (<Loader2 className="ml-2 h-4 w-4 animate-spin" />) : (<Save className="ml-2 h-4 w-4" />)}
                  ذخیره پیش‌نویس
                </Button>
                <Button
                  type="submit"
                  className="bg-journal-green text-white hover:bg-journal-green-light"
                  disabled={!!isLoading || isUploading}
                  onClick={() => handleSubmit(true)}
                >
                  {isLoading === "publish" ? (<Loader2 className="ml-2 h-4 w-4 animate-spin" />) : (<Send className="ml-2 h-4 w-4" />)}
                  ارسال برای بازبینی
                </Button>
              </div>
            </div>

            {message && (
              <div className={`p-4 mb-4 text-center rounded-lg ${message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                {message.text}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardContent className="pt-6">
                    <Input
                      placeholder="عنوان مقاله..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="text-2xl font-bold border-0 shadow-none p-0 h-auto placeholder:text-journal-light/50"
                    />
                  </CardContent>
                </Card>
                <Tiptap content={content} onChange={(newContent) => setContent(newContent)} />
              </div>
              <div className="space-y-6">
                <Card>
                  <CardHeader><CardTitle className="text-lg">تنظیمات انتشار</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-journal mb-2 block">تصویر شاخص</label>
                      {coverImageUrl ? (
                        <div className="relative">
                          <Image src={coverImageUrl} alt="Cover preview" width={400} height={200} className="rounded-md w-full object-cover" />
                          <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => setCoverImageUrl(null)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <label htmlFor="cover-upload" className="cursor-pointer flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                          {isUploading ? <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /> : <ImageIcon className="h-8 w-8 text-muted-foreground" />}
                          <span className="text-sm text-muted-foreground mt-2">آپلود تصویر</span>
                          <Input id="cover-upload" type="file" className="hidden" onChange={handleCoverImageUpload} accept="image/*" />
                        </label>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-journal mb-2 block">دسته‌بندی</label>
                      <Select value={categoryId} onValueChange={setCategoryId}>
                        <SelectTrigger><SelectValue placeholder="انتخاب دسته‌بندی" /></SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-journal mb-2 block">برچسب‌ها</label>
                      <TagInput tags={tags} setTags={setTags} />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default WritePage;