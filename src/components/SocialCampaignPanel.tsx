// src/components/SocialCampaignPanel.tsx
"use client";

import { useEffect, useState } from 'react';
import { Share2, Copy } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { SOCIAL_CAMPAIGNS, buildCampaignLink, type SocialCampaign } from '@/lib/social-campaigns';

interface SocialCampaignPanelProps {
  articleId?: number;
  articleTitle?: string;
  shareUrl?: string;
}

export const SocialCampaignPanel = ({ articleId, articleTitle, shareUrl }: SocialCampaignPanelProps) => {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<SocialCampaign[]>(SOCIAL_CAMPAIGNS);

  useEffect(() => {
    // Try refreshing campaigns from API (optional)
    fetch('/api/social/campaigns')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: SocialCampaign[]) => setCampaigns(data))
      .catch(() => setCampaigns(SOCIAL_CAMPAIGNS));
  }, []);

  const baseShareUrl = shareUrl ?? (typeof window !== 'undefined' ? window.location.href : '');

  const handleCopy = (campaign: SocialCampaign) => {
    const text = `${articleTitle ? `🔥 ${articleTitle}\n` : ''}${campaign.description}\n${campaign.hashtag}\n${baseShareUrl}`;
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          toast({ description: 'متن کمپین در کلیپ‌بورد شما کپی شد.' });
        })
        .catch(() => {
          toast({ variant: 'destructive', description: 'کپی متن با مشکل مواجه شد.' });
        });
    } else {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        toast({ description: 'متن کمپین در کلیپ‌بورد شما کپی شد.' });
      } catch (error) {
        console.error('COPY_FALLBACK_ERROR', error);
        toast({ variant: 'destructive', description: 'کپی متن با مشکل مواجه شد.' });
      }
    }
  };

  return (
    <Card className="border-dashed border-journal-green/40 bg-white/80">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-journal">
          کارت‌های آماده اشتراک‌گذاری در شبکه‌های اجتماعی
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          یکی از کمپین‌های فعال را انتخاب کنید، متن آماده را کپی کنید و لینک مقاله را به اشتراک بگذارید.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {campaigns.map((campaign) => {
          const linkWithTracking = buildCampaignLink(baseShareUrl, campaign, baseShareUrl);
          return (
            <div key={campaign.id} className="rounded-2xl border border-border/60 bg-muted/30 p-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-journal">{campaign.title}</span>
                  <span className="text-xs text-muted-foreground">#{campaign.platform}</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{campaign.description}</p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-journal-orange">
                  <span>{campaign.hashtag}</span>
                  {articleId ? <span>• #{`Article${articleId}`}</span> : null}
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={() => handleCopy(campaign)}>
                    <Copy className="ml-2 h-4 w-4" />
                    کپی متن
                  </Button>
                  <Button size="sm" asChild>
                    <a href={linkWithTracking} target="_blank" rel="noopener noreferrer">
                      <Share2 className="ml-2 h-4 w-4" />
                      باز کردن {campaign.platform}
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
