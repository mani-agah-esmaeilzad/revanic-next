'use client';

import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Share2, Check, Copy, Twitter, Download, Loader2 } from 'lucide-react';
import { FaThreads, FaWhatsapp, FaLinkedin, FaInstagram } from 'react-icons/fa6';
import { useToast } from './ui/use-toast';
import Image from 'next/image';

interface ShareButtonProps {
  articleId: number;
  title: string;
  url: string;
}

export const ShareButton = ({ articleId, title, url }: ShareButtonProps) => {
  const [copied, setCopied] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [isInstagramDialogOpen, setIsInstagramDialogOpen] = useState(false);
  const { toast } = useToast();

  const imageUrlForStory = `/api/articles/${articleId}/og-image`;

  const shareOptions = [
    {
      name: 'Twitter',
      icon: <Twitter className="h-5 w-5" />,
      action: () => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`, '_blank'),
    },
    {
      name: 'Threads',
      icon: <FaThreads className="h-5 w-5" />,
      action: () => window.open(`https://www.threads.net/share?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`, '_blank'),
    },
    {
      name: 'LinkedIn',
      icon: <FaLinkedin className="h-5 w-5" />,
      action: () => window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`, '_blank'),
    },
    {
      name: 'WhatsApp',
      icon: <FaWhatsapp className="h-5 w-5" />,
      action: () => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(title + ' ' + url)}`, '_blank'),
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

  const handleDownloadImage = async () => {
    try {
        const response = await fetch(imageUrlForStory);
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `revanic-story-${articleId}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
        console.error("Failed to download image", error);
        toast({
            title: "خطا",
            description: "خطایی در دانلود تصویر رخ داد.",
            variant: "destructive"
        });
    }
  }

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon">
            <Share2 className="h-5 w-5 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto" align="end">
          <div className="space-y-4 p-2">
              <p className="font-bold text-center">اشتراک‌گذاری</p>
              <div className="grid grid-cols-3 gap-4">
                  <button
                    onClick={() => {
                        setIsImageLoading(true);
                        setIsInstagramDialogOpen(true);
                    }}
                    className="flex flex-col items-center justify-center gap-2 p-3 rounded-lg hover:bg-accent transition-colors"
                  >
                      <FaInstagram className="h-5 w-5" />
                      <span className="text-xs">Instagram</span>
                  </button>

                  {shareOptions.map((option) => (
                      <button
                          key={option.name}
                          onClick={option.action}
                          className="flex flex-col items-center justify-center gap-2 p-3 rounded-lg hover:bg-accent transition-colors"
                      >
                          {option.icon}
                          <span className="text-xs">{option.name}</span>
                      </button>
                  ))}
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

      {/* پنجره Dialog برای نمایش استوری اینستاگرام با توضیحات بهبود یافته */}
      <Dialog open={isInstagramDialogOpen} onOpenChange={setIsInstagramDialogOpen}>
        <DialogContent className="max-w-md">
            <DialogHeader>
                <DialogTitle>اشتراک‌گذاری در استوری اینستاگرام</DialogTitle>
                <DialogDescription>
                    <div className="space-y-3 mt-2 text-right">
                        <p><strong className="font-bold">۱. تصویر را دانلود کنید:</strong> این تصویر زیبا برای استوری شما ساخته شده.</p>
                        <p><strong className="font-bold">۲. لینک را کپی کنید:</strong> لینک مقاله برای افزودن به استوری کپی می‌شود.</p>
                        <p><strong className="font-bold">۳. در اینستاگرام به اشتراک بگذارید:</strong> استوری جدید بسازید، این تصویر را انتخاب کرده و با استیکر "Link" لینک کپی شده را جای‌گذاری کنید.</p>
                    </div>
                </DialogDescription>
            </DialogHeader>
            <div className="relative w-full aspect-[9/16] mt-4 rounded-lg overflow-hidden border">
                {isImageLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                )}
                <Image 
                    src={imageUrlForStory}
                    alt="پیش‌نمایش استوری اینستاگرام"
                    fill
                    className="object-cover"
                    onLoad={() => setIsImageLoading(false)}
                />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-4">
                <Button onClick={handleCopy} variant="outline" className="w-full">
                    <Copy className="h-4 w-4 ml-2" />
                    کپی کردن لینک مقاله
                </Button>
                <Button onClick={handleDownloadImage} className="w-full">
                    <Download className="h-4 w-4 ml-2" />
                    دانلود تصویر استوری
                </Button>
            </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
