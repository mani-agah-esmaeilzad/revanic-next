// src/app/series/[slug]/feed/route.ts
import { getSeriesDetail } from '@/lib/series';

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

export async function GET(_: Request, { params }: { params: { slug: string } }) {
  const series = await getSeriesDetail(params.slug);
  if (!series) {
    return new Response('Series not found', { status: 404 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? process.env.BASE_URL ?? '';
  const feedUrl = baseUrl ? `${baseUrl}/series/${series.slug}/feed` : `/series/${series.slug}/feed`;
  const seriesUrl = baseUrl ? `${baseUrl}/series/${series.slug}` : `/series/${series.slug}`;

  const publishedArticles = series.articles.filter((item) => item.isReleased);

  const itemsXml = publishedArticles
    .map((article) => {
      const link = baseUrl ? `${baseUrl}/articles/${article.id}` : `/articles/${article.id}`;
      const pubDate = new Date(article.publishDate).toUTCString();
      return `
        <item>
          <title>${escapeXml(article.title)}</title>
          <link>${escapeXml(link)}</link>
          <guid>${escapeXml(`${link}?series=${series.slug}`)}</guid>
          <description>${escapeXml(article.excerpt)}</description>
          <pubDate>${pubDate}</pubDate>
        </item>
      `;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
  <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
    <channel>
      <title>${escapeXml(series.title)}</title>
      <link>${escapeXml(seriesUrl)}</link>
      <description>${escapeXml(series.description ?? 'سری مقالات در روانیک')}</description>
      <language>fa-IR</language>
      <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
      <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
      ${itemsXml}
    </channel>
  </rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate',
    },
  });
}
