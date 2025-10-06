// src/components/ShareButton.tsx
'use client';

import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Share2, Check, Copy, Twitter } from 'lucide-react';
import { FaThreads, FaWhatsapp, FaLinkedin, FaInstagram } from 'react-icons/fa6';
import { useToast } from './ui/use-toast';

interface ShareButtonProps {
  title: string;
  url: string;
}

export const ShareButton = ({ title, url }: ShareButtonProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleInstagramShare = async () => {
    const shareText = `${title}\n${url}`;
    try {
      if (navigator.share && navigator.canShare?.({ url })) {
        await navigator.share({ title, text: title, url });
        return;
      }
    } catch (error) {
      console.warn('WEB_SHARE_FAILED', error);
    }

    try {
      await navigator.clipboard.writeText(shareText);
      toast({ description: 'لینک و عنوان برای اشتراک‌گذاری در اینستاگرام کپی شد.' });
    } catch (error) {
      console.error('INSTAGRAM_SHARE_COPY_ERROR', error);
      toast({
        variant: 'destructive',
        description: 'امکان کپی خودکار وجود نداشت. لطفاً دستی کپی کنید.',
      });
    }

    window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
  };

  const shareOptions = [
    {
      name: 'Instagram',
      icon: <FaInstagram className="h-5 w-5" />,
      onClick: handleInstagramShare,
    },
    {
      name: 'Twitter',
      icon: <Twitter className="h-5 w-5" />,
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    },
    {
      name: 'Threads',
      icon: <FaThreads className="h-5 w-5" />,
      url: `https://www.threads.net/share?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    },
    {
      name: 'LinkedIn',
      icon: <FaLinkedin className="h-5 w-5" />,
      url: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
    },
    {
      name: 'WhatsApp',
      icon: <FaWhatsapp className="h-5 w-5" />,
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(title + ' ' + url)}`,
    },
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      toast({
        title: 'کپی شد!',
        description: 'لینک مقاله در کلیپ‌بورد شما کپی شد.',
      });
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon">
          <Share2 className="h-5 w-5 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto" align="end">
        <div className="space-y-4 p-2">
          <p className="font-bold text-center">اشتراک‌گذاری</p>
          <div className="grid grid-cols-2 gap-4">
            {shareOptions.map((option) => {
              if ('onClick' in option && option.onClick) {
                return (
                  <button
                    key={option.name}
                    type="button"
                    onClick={option.onClick}
                    className="flex flex-col items-center justify-center gap-2 rounded-lg p-3 transition-colors hover:bg-accent"
                  >
                    {option.icon}
                    <span className="text-xs">{option.name}</span>
                  </button>
                );
              }

              return (
                <a
                  key={option.name}
                  href={option.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center gap-2 rounded-lg p-3 transition-colors hover:bg-accent"
                >
                  {option.icon}
                  <span className="text-xs">{option.name}</span>
                </a>
              );
            })}
          </div>
          <div className="flex items-center space-x-2 pt-2 border-t">
            <div className="grid flex-1 gap-2">
              <input
                defaultValue={url}
                readOnly
                className="h-9 rounded-md border bg-muted px-3 text-sm text-left direction-ltr"
              />
            </div>
            <Button size="icon" className="h-9 w-9" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
