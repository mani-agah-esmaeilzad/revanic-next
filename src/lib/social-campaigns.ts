// src/lib/social-campaigns.ts
export interface SocialCampaign {
  id: string;
  platform: 'instagram' | 'threads' | 'linkedin';
  title: string;
  hashtag: string;
  description: string;
  shareUrl: string;
  utm: Record<string, string>;
}

export const SOCIAL_CAMPAIGNS: SocialCampaign[] = [
  {
    id: 'spring_series_launch',
    platform: 'instagram',
    title: 'چالش سری‌های بهاری روانیک',
    hashtag: '#RevanicSeries',
    description: 'پیشرفت مطالعه سری دلخواه خود را به اشتراک بگذارید و دوستانتان را دعوت کنید.',
    shareUrl: 'https://www.instagram.com/',
    utm: {
      utm_source: 'instagram',
      utm_medium: 'social',
      utm_campaign: 'spring_series_launch',
    },
  },
  {
    id: 'threads_highlight',
    platform: 'threads',
    title: 'گفتگوی تخصصی Threads',
    hashtag: '#RevanicThreads',
    description: 'خلاصه مهم‌ترین درسی که از مقالات روانیک گرفتید را در Threads بنویسید.',
    shareUrl: 'https://www.threads.net/',
    utm: {
      utm_source: 'threads',
      utm_medium: 'social',
      utm_campaign: 'knowledge_highlight',
    },
  },
  {
    id: 'linkedin_case_study',
    platform: 'linkedin',
    title: 'مطالعه موردی در LinkedIn',
    hashtag: '#RevanicStories',
    description: 'یک تجربه حرفه‌ای از استفاده محتواهای روانیک را با مخاطبان LinkedIn به اشتراک بگذارید.',
    shareUrl: 'https://www.linkedin.com/feed/',
    utm: {
      utm_source: 'linkedin',
      utm_medium: 'social',
      utm_campaign: 'case_study',
    },
  },
];

export function buildCampaignLink(baseUrl: string, campaign: SocialCampaign, targetUrl: string) {
  const url = new URL(campaign.shareUrl);
  const params = new URLSearchParams({ ...campaign.utm, url: targetUrl });
  return `${url.origin}${url.pathname}?${params.toString()}`;
}
