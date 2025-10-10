// src/components/Header.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Search, PenTool, User, Menu } from "lucide-react";
import Logo from "@/components/Logo";
import Link from "next/link";
import { Notifications } from "./Notifications";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from "@/components/ui/sheet";

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // تابع برای بستن منو هنگام کلیک روی لینک
  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href={`/`} className="flex items-center">
            <Logo size="lg" /> {/* Adjusted size for better look */}
          </Link>

          {/* Desktop Navigation */}
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
            <Link href="/editorial-guide" className="text-journal-light hover:text-journal transition-colors">
              راهنمای نویسندگان
            </Link>
            <Link href="/support" className="text-journal-light hover:text-journal transition-colors">
              پشتیبانی
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

            <ThemeToggle />
            <Notifications />

            <Link href="/profile">
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </Link>

            {/* Mobile Menu Trigger */}
            <div className="md:hidden">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right">
                  <SheetHeader>
                    <Logo size="lg" />
                  </SheetHeader>
                  <div className="flex flex-col gap-6 py-8">
                    <Link
                      href="/articles"
                      onClick={handleLinkClick}
                      className="text-lg text-journal-light hover:text-journal transition-colors"
                    >
                      مقالات
                    </Link>
                    <Link
                      href="/authors"
                      onClick={handleLinkClick}
                      className="text-lg text-journal-light hover:text-journal transition-colors"
                    >
                      نویسندگان
                    </Link>
                    <Link
                      href="/categories"
                      onClick={handleLinkClick}
                      className="text-lg text-journal-light hover:text-journal transition-colors"
                    >
                      دسته‌بندی‌ها
                    </Link>
                    <Link href="/editorial-guide" className="text-journal-light hover:text-journal transition-colors">
                      راهنمای نویسندگان
                    </Link>
                    <Link href="/support" className="text-journal-light hover:text-journal transition-colors">
                      پشتیبانی
                    </Link>
                    <Link
                      href="/about"
                      onClick={handleLinkClick}
                      className="text-lg text-journal-light hover:text-journal transition-colors"
                    >
                      درباره ما
                    </Link>
                    <hr className="border-border" />
                    <Link href="/write" onClick={handleLinkClick}>
                      <Button variant="outline" className="w-full">
                        <PenTool className="h-4 w-4 ml-2" />
                        نوشتن
                      </Button>
                    </Link>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
