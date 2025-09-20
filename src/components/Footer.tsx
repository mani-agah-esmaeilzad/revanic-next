import Link from "next/link";
import Logo from "@/components/Logo";

const Footer = () => {
  return (
    <footer className="bg-journal-cream border-t border-border mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="md:col-span-2">
            <Logo size="xl" className="mb-4" />
            <p className="text-journal-light max-w-md leading-relaxed">
              مجله روانیک، پلتفرمی برای انتشار و خواندن مقالات فارسی با کیفیت بالا.
              جایی برای اشتراک دانش و تجربیات نویسندگان ایرانی.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-journal mb-4">دسترسی سریع</h3>
            <div className="space-y-3">
              <Link href="/articles" className="block text-journal-light hover:text-journal transition-colors">
                مقالات
              </Link>
              <Link href="/authors" className="block text-journal-light hover:text-journal transition-colors">
                نویسندگان
              </Link>
              <Link href="/categories" className="block text-journal-light hover:text-journal transition-colors">
                دسته‌بندی‌ها
              </Link>
              <Link href="/subscription" className="block text-journal-light hover:text-journal transition-colors">
                خرید اشتراک
              </Link>
            </div>
          </div>

          {/* Support & Info */}
          <div>
            <h3 className="font-semibold text-journal mb-4">پشتیبانی</h3>
            <div className="space-y-3">
              <Link href="/about" className="block text-journal-light hover:text-journal transition-colors">
                درباره مجله
              </Link>
              <Link href="/contact" className="block text-journal-light hover:text-journal transition-colors">
                تماس با ما
              </Link>
              <Link href="/authors-guide" className="block text-journal-light hover:text-journal transition-colors">
                راهنمای نویسندگان
              </Link>
              <Link href="/privacy" className="block text-journal-light hover:text-journal transition-colors">
                حریم خصوصی
              </Link>
              <Link href="/terms" className="block text-journal-light hover:text-journal transition-colors">
                شرایط استفاده
              </Link>
            </div>
          </div>
        </div>

        <hr className="my-8 border-border" />

        <div className="text-center text-journal-light">
          <p>© 1404 مجله روانیک. تمامی حقوق محفوظ است.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
