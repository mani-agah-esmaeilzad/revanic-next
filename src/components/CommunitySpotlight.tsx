import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Quote, ArrowLeft } from "lucide-react";

export type CommunitySpotlightStory = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  achievement: string | null;
  quote: string | null;
  contributorName: string;
  contributorRole: string | null;
  featuredImageUrl: string | null;
  publication?: {
    name: string;
    slug: string;
  } | null;
};

interface CommunitySpotlightProps {
  stories: CommunitySpotlightStory[];
}

export const CommunitySpotlight = ({ stories }: CommunitySpotlightProps) => {
  if (stories.length === 0) {
    return null;
  }

  return (
    <section className="py-20 bg-gradient-to-br from-journal-cream via-background to-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center mb-12 space-y-4">
          <Badge className="bg-journal-green text-white px-4 py-1 rounded-full text-sm">صدای جامعه</Badge>
          <h2 className="text-3xl font-bold text-journal">داستان‌های موفقیت اعضای روانک</h2>
          <p className="text-journal-light text-lg">
            روایت‌هایی از نویسندگانی که با اشتراک تجربه، موجی از همکاری و یادگیری ساختند.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stories.map((story) => (
            <Card key={story.id} className="h-full border-0 shadow-soft bg-white/90 backdrop-blur">
              {story.featuredImageUrl && (
                <div className="relative w-full h-40">
                  <Image
                    src={story.featuredImageUrl}
                    alt={story.title}
                    fill
                    className="object-cover rounded-t-lg"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
              )}
              <CardHeader className="space-y-2">
                {story.publication ? (
                  <Link
                    href={`/publications/${story.publication.slug}`}
                    className="text-sm text-journal-green hover:underline"
                  >
                    {story.publication.name}
                  </Link>
                ) : null}
                <h3 className="text-xl font-semibold text-journal">{story.title}</h3>
                {story.achievement ? (
                  <Badge variant="secondary" className="bg-journal-cream text-journal-green">
                    {story.achievement}
                  </Badge>
                ) : null}
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-journal-light leading-relaxed line-clamp-4">
                  {story.excerpt}
                </p>
                {story.quote ? (
                  <div className="p-4 bg-journal-cream/60 rounded-xl text-right">
                    <Quote className="h-4 w-4 text-journal-green mb-2 ml-auto" />
                    <p className="text-sm text-journal font-medium leading-relaxed">
                      {story.quote}
                    </p>
                  </div>
                ) : null}
                <div className="flex items-center justify-between text-sm text-journal-light">
                  <div>
                    <p className="font-semibold text-journal">{story.contributorName}</p>
                    {story.contributorRole ? <p>{story.contributorRole}</p> : null}
                  </div>
                  <span className="text-journal-green">ویترین جامعه</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-4 bg-white/70 border border-journal-cream rounded-2xl px-6 py-5 shadow-soft">
          <div>
            <h3 className="text-xl font-semibold text-journal mb-1">شما هم تجربه‌ای الهام‌بخش دارید؟</h3>
            <p className="text-sm text-journal-light">
              داستان خود را برای ما بفرستید تا در ویترین جامعه روانک منتشر شود.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/support">
              <Button className="bg-journal-green hover:bg-journal text-white">
                ارسال داستان جدید
                <ArrowLeft className="h-4 w-4 mr-2" />
              </Button>
            </Link>
            <Link href="/editorial-guide" className="text-journal-green hover:underline text-sm">
              مشاهده راهنمای سردبیری
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
