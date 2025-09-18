// src/emails/ArticleStatusEmail.tsx
import * as React from 'react';
import { Html, Button, Heading, Text, Hr } from '@react-email/components';

interface ArticleStatusEmailProps {
  authorName: string;
  articleTitle: string;
  status: 'APPROVED' | 'REJECTED';
  articleId: number;
}

export const ArticleStatusEmail: React.FC<Readonly<ArticleStatusEmailProps>> = ({
  authorName,
  articleTitle,
  status,
  articleId,
}) => {
  const isApproved = status === 'APPROVED';

  return (
    <Html lang="fa" dir="rtl">
      <Heading as="h1">
        وضعیت مقاله شما در روانیک به‌روزرسانی شد
      </Heading>
      <Text>سلام {authorName || 'نویسنده عزیز'}،</Text>
      <Text>
        باخبر شدیم که وضعیت مقاله شما با عنوان «{articleTitle}» به‌روزرسانی شده است:
      </Text>
      <Text
        style={{
          color: isApproved ? '#4CAF50' : '#F44336',
          fontWeight: 'bold',
          fontSize: '18px',
        }}
      >
        {isApproved ? 'تایید و منتشر شد' : 'رد شد'}
      </Text>
      {isApproved ? (
        <Text>
          تبریک! مقاله شما اکنون در سایت قابل مشاهده است و خوانندگان می‌توانند از آن لذت ببرند.
        </Text>
      ) : (
        <Text>
          متاسفانه مقاله شما با قوانین انتشار محتوای ما مطابقت نداشت. لطفاً آن را بازبینی کرده و دوباره تلاش کنید یا با پشتیبانی تماس بگیرید.
        </Text>
      )}
      <Button
        href={`${process.env.NEXT_PUBLIC_BASE_URL}/articles/${articleId}`}
        style={{
          backgroundColor: '#2196F3',
          color: 'white',
          padding: '12px 20px',
          borderRadius: '5px',
          textDecoration: 'none',
        }}
      >
        مشاهده مقاله
      </Button>
      <Hr />
      <Text>با احترام،</Text>
      <Text>تیم مدیریت محتوای روانیک</Text>
    </Html>
  );
};