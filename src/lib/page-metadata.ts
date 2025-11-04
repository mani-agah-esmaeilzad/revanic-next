// src/lib/page-metadata.ts
import type { Metadata } from "next";
import { buildCanonical } from "./seo";

interface StaticMetadataOptions {
  title: string;
  description: string;
  path?: string;
  keywords?: string[];
}

export function buildStaticMetadata(options: StaticMetadataOptions): Metadata {
  const { title, description, path, keywords } = options;
  const canonical = path ? buildCanonical(path) : undefined;
  const pageTitle = title.includes("روانک") ? title : `${title} | روانک`;

  return {
    title: pageTitle,
    description,
    ...(canonical ? { alternates: { canonical } } : {}),
    ...(keywords ? { keywords } : {}),
    openGraph: {
      title: pageTitle,
      description,
      ...(canonical ? { url: canonical } : {}),
      siteName: "روانک",
      locale: "fa_IR",
      type: "website",
    },
    twitter: {
      card: "summary",
      title: pageTitle,
      description,
    },
  };
}
