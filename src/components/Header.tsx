"use client"; // Header needs to be a client component if it has interactive elements or hooks in the future, like a mobile menu state.

import { Button } from "@/components/ui/button";
import { Search, PenTool, User, Menu } from "lucide-react";
import Logo from "@/components/Logo";
import Link from "next/link";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={`/`} className="flex items-center">
            <Logo size="xl" />
          </Link>

          {/* Navigation */}
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

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="hidden sm:flex">
              <Search className="h-4 w-4 ml-2" />
              جستجو
            </Button>

            <Link href="/write">
              <Button variant="outline" size="sm" className="hidden sm:flex">
                <PenTool className="h-4 w-4 ml-2" />
                نوشتن
              </Button>
            </Link>

            <Link href="/profile">
              <Button variant="ghost" size="sm">
                <User className="h-4 w-4 ml-2" />
                پروفایل
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
