// src/components/Header.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Search, PenTool, User, Menu } from "lucide-react";
import Logo from "@/components/Logo";
import Link from "next/link";
import { Notifications } from "./Notifications"; // <-- ایمپورت کامپوننت جدید

const Header = () => {
  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href={`/`} className="flex items-center">
            <Logo size="xl" />
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/articles" className="text-journal-light hover:text-journal transition-colors">
              مقالات
            </Link>
            <Link href="/authors" className="text-journal-light hover:text-journal transition-colors">
              نویسندگان
            </Link>
            <Link href="/categories" className="text-journal-light hover:text-journal transition-colors">
              دسته‌بندی‌ها
            </Link>
            <Link href="/about" className="text-journal-light hover:text-journal transition-colors">
              درباره ما
            </Link>
          </nav>

          <div className="flex items-center gap-1">
            <Link href="/search">
              <Button variant="ghost" size="icon" className="hidden sm:flex">
                <Search className="h-5 w-5" />
              </Button>
            </Link>

            <Link href="/write">
              <Button variant="outline" size="sm" className="hidden sm:flex">
                <PenTool className="h-4 w-4 ml-2" />
                نوشتن
              </Button>
            </Link>

            {/* --- اضافه کردن کامپوننت نوتیفیکیشن‌ها --- */}
            <Notifications />

            <Link href="/profile">
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </Link>

            <Button variant="ghost" size="sm" className="md:hidden">
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;