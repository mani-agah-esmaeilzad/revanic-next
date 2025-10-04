import { prisma } from "@/lib/prisma";
import { PublicationCard } from "@/components/PublicationCard";
import { Card, CardContent } from "@/components/ui/card";
import { Users, FileText, Sparkles } from "lucide-react";

const PublicationsPage = async () => {
  const publications = await prisma.publication.findMany({
    include: {
      _count: { select: { members: true, articles: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalPublications = publications.length;
  const totalMembers = publications.reduce((sum, publication) => sum + publication._count.members, 0);
  const totalArticles = publications.reduce((sum, publication) => sum + publication._count.articles, 0);

  const featuredPublications = [...publications]
    .sort((a, b) => b._count.articles - a._count.articles)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <section className="py-16 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto text-center space-y-6">
            <h1 className="text-4xl font-bold text-foreground">انتشارات روانیک</h1>
            <p className="text-lg text-muted-foreground">
              از نشریات تخصصی و جمعی روانیک بازدید کنید و با نویسندگان حرفه‌ای همکاری داشته باشید.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-0 shadow-soft">
                <CardContent className="flex flex-col items-center gap-2 py-6">
                  <Users className="h-8 w-8 text-journal-green" />
                  <p className="text-sm text-muted-foreground">کل اعضای فعال</p>
                  <span className="text-2xl font-bold">{totalMembers.toLocaleString("fa-IR")}</span>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-soft">
                <CardContent className="flex flex-col items-center gap-2 py-6">
                  <FileText className="h-8 w-8 text-journal-orange" />
                  <p className="text-sm text-muted-foreground">مجموع مقالات منتشر شده</p>
                  <span className="text-2xl font-bold">{totalArticles.toLocaleString("fa-IR")}</span>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-soft">
                <CardContent className="flex flex-col items-center gap-2 py-6">
                  <Sparkles className="h-8 w-8 text-journal" />
                  <p className="text-sm text-muted-foreground">تعداد نشریات فعال</p>
                  <span className="text-2xl font-bold">{totalPublications.toLocaleString("fa-IR")}</span>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {featuredPublications.length > 0 && (
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-2xl font-bold text-foreground mb-6 text-center">نشریات پیشنهادی</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {featuredPublications.map((publication) => (
                  <PublicationCard
                    key={publication.id}
                    name={publication.name}
                    slug={publication.slug}
                    description={publication.description}
                    avatarUrl={publication.avatarUrl}
                    membersCount={publication._count.members}
                    articlesCount={publication._count.articles}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {publications.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {publications.map((publication) => (
                  <PublicationCard
                    key={publication.id}
                    name={publication.name}
                    slug={publication.slug}
                    description={publication.description}
                    avatarUrl={publication.avatarUrl}
                    membersCount={publication._count.members}
                    articlesCount={publication._count.articles}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">
                  هنوز هیچ انتشاراتی ثبت نشده است.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default PublicationsPage;
