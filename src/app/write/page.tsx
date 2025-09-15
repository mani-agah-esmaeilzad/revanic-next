"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, Send, AlertCircle, Loader2 } from "lucide-react";

const WritePage = () => {
  const router = useRouter();
  const [articleId, setArticleId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [isLoading, setIsLoading] = useState<"save" | "publish" | false>(false);
  const [message, setMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);

  const categories = [
    "فناوری",
    "تاریخ",
    "هنر و معماری",
    "علم",
    "فرهنگ",
    "سیاست",
    "اقتصاد",
    "ورزش",
    "سلامت",
    "محیط زیست",
  ];

  const handleSubmit = async (published: boolean) => {
    setIsLoading(published ? "publish" : "save");
    setMessage(null);

    const isUpdating = articleId !== null;
    const url = isUpdating ? `/api/articles/${articleId}` : "/api/articles";
    const method = isUpdating ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, published }),
      });

      const result = await response.json();

      if (response.ok) {
        if (published) {
          router.push(`/articles/${result.id}`);
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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(true);
          }}
          className="max-w-4xl mx-auto"
        >
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
                disabled={!!isLoading}
              >
                {isLoading === "save" ? (
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="ml-2 h-4 w-4" />
                )}
                ذخیره پیش‌نویس
              </Button>
              <Button
                type="submit"
                className="bg-journal-green text-white hover:bg-journal-green-light"
                disabled={!!isLoading}
              >
                {isLoading === "publish" ? (
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="ml-2 h-4 w-4" />
                )}
                انتشار
              </Button>
            </div>
          </div>

          {message && (
            <div
              className={`p-4 mb-4 text-center rounded-lg ${message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
            >
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
                    required
                  />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <Textarea
                    placeholder="محتوای مقاله خود را بنویسید..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-96 border-0 shadow-none resize-none text-base leading-relaxed"
                    required
                  />
                </CardContent>
              </Card>
            </div>
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">تنظیمات</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-journal mb-2 block">
                      دسته‌بندی
                    </label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="انتخاب دسته‌بندی" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WritePage;
