/* eslint-disable @next/next/no-img-element */
import React from 'react';

// آبجکتی برای نگهداری اطلاعات تصاویر
interface ImageData {
  src: string;
  width: number;
  height: number;
}

// Props کامپوننت برای دریافت تمام اطلاعات لازم
interface RevanicStoryProps {
  title: string;
  authorName: string;
  authorAvatarUrl: string; // آواتار نویسنده
  readTime: string;
  coverImage: ImageData | null; // تصویر مقاله
  logo: ImageData | null;       // لوگوی روانیک
}

// این کامپوننت فقط برای رندر شدن به عنوان تصویر در سمت سرور استفاده می‌شود
export const InstagramStory = ({ 
  title, 
  authorName, 
  authorAvatarUrl,
  readTime,
  coverImage,
  logo,
}: RevanicStoryProps) => {
  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f3f2ef', // پس‌زمینه کرم روشن
        fontFamily: '"Vazirmatn"',
        padding: '80px',
        direction: 'rtl', // **مهم: تنظیم جهت کلی به راست-به-چپ**
      }}
    >
        {/* هدر: لوگو و نام سایت */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#1a5a4c' }}>
            {logo && (
                <img
                    src={logo.src}
                    alt="Revanic Logo"
                    width={50}
                    height={50}
                    style={{ objectFit: 'contain' }}
                />
            )}
            {/* متن فارسی به صورت مستقیم و بدون دستکاری نوشته می‌شود */}
            <span style={{ fontSize: 42, fontWeight: 700 }}>روانیک</span>
        </div>

        {/* خط جداکننده */}
        <div style={{ width: '100%', height: '2px', backgroundColor: '#e5e7eb', margin: '30px 0' }} />

        {/* محتوای اصلی */}
        <div 
            style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'center', 
                flexGrow: 1,
                width: '100%',
                textAlign: 'right', // هم‌ترازی متن به راست
            }}
        >
            {/* تصویر مقاله */}
            {coverImage && (
                <div style={{ display: 'flex', width: '100%', marginBottom: '40px' }}>
                    <img
                        src={coverImage.src}
                        alt={title}
                        width={920}
                        height={500}
                        style={{
                            borderRadius: '24px',
                            objectFit: 'cover',
                        }}
                    />
                </div>
            )}

            {/* عنوان مقاله */}
            <p 
                style={{ 
                    fontSize: '84px', 
                    fontWeight: 800, 
                    lineHeight: 1.3, 
                    color: '#1f2937', 
                    margin: 0,
                }}
            >
                {title}
            </p>
        </div>

        {/* فوتر: اطلاعات نویسنده و زمان مطالعه */}
        <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <img
                    src={authorAvatarUrl}
                    alt={authorName}
                    width={80}
                    height={80}
                    style={{ borderRadius: '9999px', objectFit: 'cover' }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <p style={{ fontSize: '36px', fontWeight: 700, color: '#111', margin: 0 }}>
                        {authorName}
                    </p>
                    <p style={{ fontSize: '28px', color: '#666', margin: 0 }}>نویسنده</p>
                </div>
            </div>
             <p style={{ fontSize: '32px', color: '#6b7280', margin: 0 }}>
                {`مطالعه ${readTime}`}
             </p>
        </div>
    </div>
  );
};

