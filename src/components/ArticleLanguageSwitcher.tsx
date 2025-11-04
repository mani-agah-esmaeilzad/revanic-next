"use client";

import { useMemo } from "react";
import { Globe2 } from "lucide-react";

import { ArticleContent } from "@/components/ArticleContent";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ArticleLanguageSwitcherProps {
  articleId: number;
  persianContent: string;
  englishContent?: string | null;
  persianTitle: string;
  englishTitle?: string | null;
  translationProvider?: string | null;
}

export const ArticleLanguageSwitcher = ({
  articleId,
  persianContent,
  englishContent,
  persianTitle,
  englishTitle,
  translationProvider,
}: ArticleLanguageSwitcherProps) => {
  const hasTranslation = Boolean(englishContent && englishContent.trim().length > 0);

  const providerName = useMemo(() => {
    if (!translationProvider) {
      return "هوش مصنوعی";
    }
    if (translationProvider.toUpperCase() === "GEMINI") {
      return "Gemini";
    }
    return translationProvider;
  }, [translationProvider]);

  if (!hasTranslation) {
    return <ArticleContent articleId={articleId} content={persianContent} />;
  }

  return (
    <Tabs defaultValue="fa" className="w-full space-y-6">
      <TabsList className="flex w-full justify-center gap-2 rounded-2xl bg-muted/60 p-1">
        <TabsTrigger value="fa" className="rounded-xl px-4 py-2 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
          فارسی
        </TabsTrigger>
        <TabsTrigger value="en" className="rounded-xl px-4 py-2 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
          English
        </TabsTrigger>
      </TabsList>

      <TabsContent value="fa" className="outline-none">
        <ArticleContent articleId={articleId} content={persianContent} />
      </TabsContent>

      <TabsContent value="en" className="outline-none">
        <div className="space-y-6">
          <div className="rounded-2xl border border-border/60 bg-card/70 p-6 shadow-sm backdrop-blur">
            <h2 className="text-2xl font-bold leading-tight text-foreground md:text-3xl">
              {englishTitle ?? persianTitle}
            </h2>
          </div>
          <ArticleContent articleId={articleId} content={englishContent ?? ""} enableHighlights={false} />
          <Alert className="border-journal-cream/60 bg-journal-cream/30">
            <Globe2 className="h-5 w-5 text-journal-green" />
            <AlertTitle>ترجمه خودکار</AlertTitle>
            <AlertDescription>
              این نسخه انگلیسی توسط هوش مصنوعی {providerName} ترجمه شده است و ممکن است شامل تفاوت‌های جزئی با متن فارسی باشد.
            </AlertDescription>
          </Alert>
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default ArticleLanguageSwitcher;
