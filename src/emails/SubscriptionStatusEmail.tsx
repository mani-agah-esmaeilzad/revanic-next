// src/emails/SubscriptionStatusEmail.tsx
import * as React from 'react';
import { Html, Button, Heading, Text, Hr } from '@react-email/components';

interface SubscriptionStatusEmailProps {
    userName: string;
    status: 'ACTIVE' | 'REJECTED';
}

export const SubscriptionStatusEmail: React.FC<Readonly<SubscriptionStatusEmailProps>> = ({
    userName,
    status,
}) => {
    const isApproved = status === 'ACTIVE';

    return (
        <Html lang="fa" dir="rtl">
            <Heading as="h1">
                وضعیت اشتراک دانشجویی شما در روانیک
            </Heading>
            <Text>سلام {userName || 'کاربر عزیز'}،</Text>
            <Text>
                درخواست اشتراک دانشجویی شما بررسی شد و نتیجه آن به شرح زیر است:
            </Text>
            <Text
                style={{
                    color: isApproved ? '#4CAF50' : '#F44336',
                    fontWeight: 'bold',
                    fontSize: '18px',
                }}
            >
                {isApproved ? 'تایید شد' : 'رد شد'}
            </Text>
            {isApproved ? (
                <Text>
                    تبریک! اشتراک یک‌ساله دانشجویی برای شما فعال شد. از دسترسی نامحدود به تمام مقالات لذت ببرید.
                </Text>
            ) : (
                <Text>
                    متاسفانه اطلاعات ارسالی شما واضح نبود یا مورد تایید قرار نگرفت. لطفاً با پشتیبانی ما در تماس باشید.
                </Text>
            )}
            <Button
                href={`${process.env.NEXT_PUBLIC_BASE_URL}/profile`}
                style={{
                    backgroundColor: '#2196F3',
                    color: 'white',
                    padding: '12px 20px',
                    borderRadius: '5px',
                    textDecoration: 'none',
                }}
            >
                مشاهده پروفایل
            </Button>
            <Hr />
            <Text>با احترام،</Text>
            <Text>تیم روانیک</Text>
        </Html>
    );
};