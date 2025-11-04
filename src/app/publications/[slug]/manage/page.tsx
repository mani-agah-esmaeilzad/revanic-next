import type { Metadata } from "next";

import { prisma } from "@/lib/prisma";
import { buildCanonical } from "@/lib/seo";
import { ManagePublicationClient } from "./ManagePublicationClient";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const slug = decodeURIComponent(params.slug);
  const publication = await prisma.publication.findUnique({
    where: { slug },
    select: { name: true },
  });

  if (!publication) {
    return {
      title: "مدیریت نشریه | روانک",
      description: "نشریه مورد نظر برای مدیریت پیدا نشد.",
    };
  }

  const canonical = buildCanonical(`/publications/${slug}/manage`);
  const title = `مدیریت ${publication.name} | روانک`;
  const description = `اعضا و تنظیمات نشریه ${publication.name} را در مجله روانک مدیریت کنید.`;

  return {
    title,
    description,
    ...(canonical ? { alternates: { canonical } } : {}),
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

const ManagePublicationPage = ({ params }: { params: { slug: string } }) => {
  const slug = decodeURIComponent(params.slug);
  return <ManagePublicationClient slug={slug} />;
};

export default ManagePublicationPage;
