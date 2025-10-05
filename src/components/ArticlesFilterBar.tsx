// src/components/ArticlesFilterBar.tsx
"use client";

import { useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { LayoutGrid, List } from "lucide-react";

const SORT_OPTIONS = [
  { value: "newest", label: "جدیدترین" },
  { value: "popular", label: "محبوب‌ترین" },
  { value: "discussion", label: "پرگفت‌وگوترین" },
] as const;

const LENGTH_OPTIONS = [
  { value: "all", label: "همه طول‌ها" },
  { value: "short", label: "کوتاه" },
  { value: "medium", label: "متوسط" },
  { value: "long", label: "بلند" },
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number]["value"];
export type LengthOption = (typeof LENGTH_OPTIONS)[number]["value"];
export type ViewOption = "list" | "grid";

interface ArticlesFilterBarProps {
  sort: SortOption;
  length: LengthOption;
  view: ViewOption;
  search: string;
  preservedParams: Record<string, string | undefined>;
}

const ArticlesFilterBar = ({ sort, length, view, search, preservedParams }: ArticlesFilterBarProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(search);
  const [isPending, startTransition] = useTransition();

  const baseParams = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries(preservedParams).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });
    const currentParams = searchParams;
    if (currentParams) {
      currentParams.forEach((value, key) => {
        if (!params.has(key) && key !== "page" && !(key in preservedParams)) {
          params.set(key, value);
        }
      });
    }
    return params;
  }, [preservedParams, searchParams]);

  const updateParam = (key: string, value?: string) => {
    startTransition(() => {
      const params = new URLSearchParams(baseParams.toString());
      params.delete("page");
      if (value && value !== "") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      const queryString = params.toString();
      router.push(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
    });
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateParam("q", searchTerm.trim() || undefined);
  };

  return (
    <div className="rounded-3xl border border-journal-cream bg-white/80 p-4 shadow-soft">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <form onSubmit={handleSearchSubmit} className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="جست‌وجوی عنوان یا خلاصه"
            className="flex-1"
          />
          <Button type="submit" disabled={isPending}>
            اعمال جست‌وجو
          </Button>
        </form>
        <div className="flex flex-wrap items-center gap-2">
          {SORT_OPTIONS.map((option) => (
            <Button
              key={option.value}
              type="button"
              variant={sort === option.value ? "default" : "outline"}
              size="sm"
              className="rounded-full"
              onClick={() => updateParam("sort", option.value === "newest" ? undefined : option.value)}
              disabled={isPending && sort !== option.value}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {LENGTH_OPTIONS.map((option) => (
            <Button
              key={option.value}
              type="button"
              variant={length === option.value ? "secondary" : "ghost"}
              size="sm"
              className={cn(
                "rounded-full",
                option.value === "all" && "text-journal"
              )}
              onClick={() => updateParam("length", option.value === "all" ? undefined : option.value)}
              disabled={isPending && length !== option.value}
            >
              {option.label}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="icon"
            variant={view === "list" ? "default" : "outline"}
            onClick={() => updateParam("view", undefined)}
            aria-label="نمای فهرستی"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant={view === "grid" ? "default" : "outline"}
            onClick={() => updateParam("view", "grid")}
            aria-label="نمای کارت شبکه‌ای"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ArticlesFilterBar;
