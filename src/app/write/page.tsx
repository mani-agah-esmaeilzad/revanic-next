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
import { useQuery } from "@tanstack/react-query";

// لود کردن دینامیک ادیتور برای جلوگیری از خطای SSR
const Tiptap = dynamic(() => import('@/components/editor/Tiptap'), {
  ssr: false,
  loading: () => <Skeleton className="min-h-[400px] w-full" />,
});

// تعریف تایپ‌ها
interface Category {
  id: number;
  name: string;
}
interface Publication {
    id: number;
    name: string;
}

const DRAFT_KEY = 'revanic_article_draft';

// توابع دریافت داده برای React Query
const fetchUserPublications = async (): Promise<Publication[]> => {
    const res = await fetch('/api/me/publications');
    if (!res.ok) throw new Error('Failed to fetch publications');
    return res.json();
}
const fetchCategories = async (): Promise<Category[]> => {
    const res = await fetch('/api/categories');
    if(!res.ok) throw new Error('Failed to fetch categories');
    return res.json();
}

const WritePage = () => {
  const router = useRouter();
  
  // State های کامپوننت
  const [articleId, setArticleId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [publicationId, setPublicationId] = useState<string>("personal");
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState<"save" | "publish" | false>(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string; } | null>(null);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const isInitialLoad = useRef(true);

  // دریافت داده‌های اولیه با React Query
  const { data: categories = [], isError: isCategoriesError } = useQuery<Category[]>({ queryKey: ['categories'], queryFn: fetchCategories });
  const { data: publications = [], isError: isPublicationsError } = useQuery<Publication[]>({ queryKey: ['userPublications'], queryFn: fetchUserPublications });

  // منطق ذخیره و بازیابی خودکار پیش‌نویس
  useEffect(() => {
    if (isInitialLoad.current) {
      const savedDraft = localStorage.getItem(DRAFT_KEY);
      if (savedDraft) setShowRestoreDialog(true);
      isInitialLoad.current = false;
    }
  }, []);

  useEffect(() => {
    if (!isInitialLoad.current) {
      const draft = JSON.stringify({ title, content, coverImageUrl, categoryId, tags, publicationId });
      localStorage.setItem(DRAFT_KEY, draft);
    }
  }, [title, content, coverImageUrl, categoryId, tags, publicationId]);

  const handleRestore = () => {
    const savedDraft = localStorage.getItem(DRAFT_KEY);
    if (savedDraft) {
      const { title, content, coverImageUrl, categoryId, tags, publicationId } = JSON.parse(savedDraft);
      setTitle(title);
      setContent(content);
      setCoverImageUrl(coverImageUrl);
      setCategoryId(categoryId);
      setTags(tags || []);
      setPublicationId(publicationId || 'personal');
    }
    setShowRestoreDialog(false);
  };
  const handleDiscard = () => {
    localStorage.removeItem(DRAFT_KEY);
    setShowRestoreDialog(false);
  };
  const clearDraft = () => localStorage.removeItem(DRAFT_KEY);

  const handleCoverImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    // ... (این تابع بدون تغییر باقی می‌ماند)
  };

  const handleSubmit = async (published: boolean) => {
    // ... (این تابع هم بدون تغییر باقی می‌ماند)
  };

  return (
    <>
      <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>بازیابی پیش‌نویس ذخیره شده</AlertDialogTitle>
            <AlertDialogDescription>
              یک پیش‌نویس ناتمام یافت شد. آیا مایل به بازیابی آن هستید؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDiscard}>حذف</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestore}>بازیابی</AlertDialogAction>
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
                  {articleId ? `در حال ویرایش پیش‌نویس...` : "داستان خود را با جهان به اشتراک بگذارید"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleSubmit(false)} disabled={!!isLoading || isUploading}>
                  {isLoading === "save" ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Save className="ml-2 h-4 w-4" />}
                  ذخیره پیش‌نویس
                </Button>
                <Button className="bg-journal-green text-white hover:bg-journal-green-light" disabled={!!isLoading || isUploading} onClick={() => handleSubmit(true)}>
                  {isLoading === "publish" ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Send className="ml-2 h-4 w-4" />}
                  ارسال
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
                    <Input placeholder="عنوان مقاله..." value={title} onChange={(e) => setTitle(e.target.value)} className="text-2xl font-bold border-0 shadow-none p-0 h-auto"/>
                  </CardContent>
                </Card>
                <Tiptap content={content} onChange={(newContent) => setContent(newContent)} />
              </div>
              <div className="space-y-6">
                <Card>
                  <CardHeader><CardTitle className="text-lg">تنظیمات انتشار</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-journal mb-2 block">انتشار در</label>
                      <Select value={publicationId} onValueChange={setPublicationId}>
                        <SelectTrigger><SelectValue placeholder="محل انتشار" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="personal">پروفایل شخصی</SelectItem>
                            {isPublicationsError && <p className="text-xs text-red-500 p-2">خطا در دریافت لیست</p>}
                            {publications.map((pub) => (
                                <SelectItem key={pub.id} value={String(pub.id)}>{pub.name}</SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-journal mb-2 block">تصویر شاخص</label>
                      {/* ... کد آپلود تصویر ... */}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-journal mb-2 block">دسته‌بندی</label>
                      <Select value={categoryId} onValueChange={setCategoryId}>
                        <SelectTrigger><SelectValue placeholder="انتخاب دسته‌بندی" /></SelectTrigger>
                        <SelectContent>
                          {isCategoriesError && <p className="text-xs text-red-500 p-2">خطا در دریافت لیست</p>}
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