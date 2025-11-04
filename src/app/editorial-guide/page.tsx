import { format } from "date-fns";
import { faIR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  EDITORIAL_SECTIONS,
  EDITORIAL_TIPS,
  EDITORIAL_VALUES,
  ensureEditorialCalendarEntries,
  getEditorialCalendarEntries,
} from "@/lib/editorial-guide";
import Link from "next/link";
import { buildStaticMetadata } from "@/lib/page-metadata";

export const metadata = buildStaticMetadata({
  title: "راهنمای سردبیری روانک",
  description:
    "با ارزش‌ها، تقویم انتشار و استانداردهای سردبیری مجله روانک آشنا شوید تا محتوایی هم‌سو با جامعه منتشر کنید.",
  path: "/editorial-guide",
  keywords: ["راهنمای سردبیری روانک", "سیاست‌های انتشار روانک", "تقویم سردبیری"],
});

const EditorialGuidePage = async () => {
  await ensureEditorialCalendarEntries();
  const calendar = await getEditorialCalendarEntries();

  const calendarByMonth = calendar.reduce<Record<string, typeof calendar>>((acc, entry) => {
    const month = format(entry.publishDate, "MMMM yyyy", { locale: faIR });
    if (!acc[month]) {
      acc[month] = [];
    }
    acc[month].push(entry);
    return acc;
  }, {});

  const monthKeys = Object.keys(calendarByMonth);

  return (
    <div className="min-h-screen bg-background">
      <section className="py-16 bg-gradient-to-br from-journal-cream via-background to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <Badge className="bg-journal-green text-white px-4 py-1 rounded-full text-sm">
              راهنمای نویسندگان
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-journal leading-tight">
              لحن، ساختار و تقویم انتشار در روانک
            </h1>
            <p className="text-lg text-journal-light leading-relaxed">
              این راهنما برای همسویی با ارزش‌های جامعه روانک تدوین شده است تا هر نویسنده‌ای بتواند
              روایت خود را با کیفیتی حرفه‌ای و لحن فارسی روان منتشر کند.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/write">
                <Button size="lg" className="bg-journal-green hover:bg-journal text-white">
                  شروع نگارش مقاله
                </Button>
              </Link>
              <Link href="/support">
                <Button variant="outline" size="lg" className="border-journal-green text-journal-green">
                  هماهنگی با تیم سردبیری
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {EDITORIAL_VALUES.map((value) => (
              <Card key={value.title} className="border-0 shadow-soft h-full">
                <CardContent className="p-6 space-y-4">
                  <h2 className="text-xl font-semibold text-journal">{value.title}</h2>
                  <p className="text-sm text-journal-light leading-relaxed">{value.description}</p>
                  <ul className="space-y-2 text-sm text-journal">
                    {value.examples.map((example) => (
                      <li key={example} className="flex items-start gap-2">
                        <span className="mt-1 h-2 w-2 rounded-full bg-journal-green" />
                        <span className="leading-relaxed">{example}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-journal-cream/40">
        <div className="container mx-auto px-4 space-y-10">
          {EDITORIAL_SECTIONS.map((section) => (
            <div
              key={section.title}
              className="bg-white/80 border border-journal-cream rounded-2xl shadow-soft p-8 space-y-4"
            >
              <h2 className="text-2xl font-bold text-journal">{section.title}</h2>
              <p className="text-journal-light leading-relaxed">{section.body}</p>
              <ul className="grid gap-3 md:grid-cols-2">
                {section.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-3 text-sm text-journal">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-journal-green" />
                    <span className="leading-relaxed">{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 space-y-10">
          <div className="max-w-3xl mx-auto text-center space-y-3">
            <h2 className="text-3xl font-bold text-journal">تقویم سردبیری</h2>
            <p className="text-journal-light text-base">
              برنامه ماهانه انتشار را دنبال کنید تا با انتشار هماهنگ، صدای واحدی برای جامعه بسازیم.
            </p>
          </div>

          <div className="space-y-8">
            {monthKeys.map((month) => (
              <div key={month} className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-journal-green" />
                  <h3 className="text-xl font-semibold text-journal">{month}</h3>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {calendarByMonth[month].map((entry) => (
                    <Card key={entry.slug} className="border border-journal-cream bg-white/80">
                      <CardContent className="p-6 space-y-3">
                        <div className="flex items-center justify-between text-sm text-journal-light">
                          <span>{format(entry.publishDate, "dd MMMM", { locale: faIR })}</span>
                          <Badge variant="secondary" className="bg-journal-cream text-journal-green">
                            {entry.focus}
                          </Badge>
                        </div>
                        <h4 className="text-lg font-semibold text-journal">{entry.title}</h4>
                        {entry.description ? (
                          <p className="text-sm text-journal-light leading-relaxed">{entry.description}</p>
                        ) : null}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-journal-cream/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {EDITORIAL_TIPS.map((tip) => (
              <Card key={tip.title} className="border-0 shadow-soft">
                <CardContent className="p-6 space-y-4">
                  <h3 className="text-xl font-semibold text-journal">{tip.title}</h3>
                  <ul className="space-y-2 text-sm text-journal-light">
                    {tip.items.map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <span className="mt-1 h-2 w-2 rounded-full bg-journal-green" />
                        <span className="leading-relaxed text-journal">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-gradient-to-br from-journal-green to-journal rounded-3xl text-white p-10 space-y-4 shadow-medium">
            <h2 className="text-3xl font-bold">چطور با تیم سردبیری همکاری کنیم؟</h2>
            <p className="text-base leading-relaxed opacity-95">
              اگر برای موضوع، انتخاب منابع یا برنامه‌ریزی انتشار به راهنمایی بیشتری نیاز دارید، تیم سردبیری روانک با کمال میل کنار شماست.
              کافی است از طریق پشتیبانی پیام دهید یا در رویدادهای ماهانه حضور پیدا کنید.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/support">
                <Button variant="secondary" className="bg-white text-journal-green hover:bg-journal-cream">
                  ارسال درخواست راهنمایی
                </Button>
              </Link>
              <Link href="/insights">
                <Button variant="outline" className="border-white text-white hover:bg-white/10">
                  مشاهده گزارش رشد جامعه
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default EditorialGuidePage;
