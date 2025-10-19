// src/lib/seo.ts
export function getDeploymentUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_BASE_URL;
  if (explicit) return explicit;
  const vercel = process.env.VERCEL_URL;
  if (vercel) {
    return vercel.startsWith("http") ? vercel : `https://${vercel}`;
  }
  return "";
}

export function buildCanonical(pathname: string): string | undefined {
  const base = getDeploymentUrl();
  if (!base) return undefined;
  return `${base.replace(/\/$/, "")}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}

export function organizationJsonLd() {
  const url = getDeploymentUrl() || "https://revanic.example";
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "روانیک",
    url,
    logo: `${url}/icons/icon-512x512.png`,
    sameAs: ["https://www.instagram.com", "https://www.linkedin.com"],
  };
}

export function webSiteJsonLd() {
  const url = getDeploymentUrl() || "https://revanic.example";
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "مجله روانیک",
    url,
    potentialAction: {
      "@type": "SearchAction",
      target: `${url}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function articleJsonLd(params: {
  title: string;
  description: string;
  url: string;
  image?: string | null;
  publishDate: string;
  modifiedDate: string;
  authorName?: string | null;
}) {
  const { title, description, url, image, publishDate, modifiedDate, authorName } = params;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    url,
    image: image ? [image] : undefined,
    datePublished: publishDate,
    dateModified: modifiedDate,
    author: authorName
      ? {
          "@type": "Person",
          name: authorName,
        }
      : undefined,
    publisher: {
      "@type": "Organization",
      name: "روانیک",
      logo: {
        "@type": "ImageObject",
        url: `${getDeploymentUrl() || url}/icons/icon-512x512.png`,
      },
    },
  };
}

export function itemListJsonLd(params: {
  url: string;
  items: Array<{ title: string; url: string; description?: string }>;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: params.items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: item.url,
      name: item.title,
      description: item.description,
    })),
  };
}

export function personJsonLd(params: {
  name: string;
  url: string;
  image?: string | null;
  description?: string | null;
  sameAs?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: params.name,
    url: params.url,
    image: params.image ?? undefined,
    description: params.description ?? undefined,
    sameAs: params.sameAs ?? undefined,
  };
}
