
import * as React from 'react';
import { Html, Button, Heading, Text, Hr } from '@react-email/components';

interface WelcomeEmailProps {
    name: string;
}

export const WelcomeEmail: React.FC<Readonly<WelcomeEmailProps>> = ({ name }) => (
    <Html lang="fa" dir="rtl">
        <Heading as="h1">به مجله روانیک خوش آمدید!</Heading>
        <Text>سلام {name || 'کاربر عزیز'}،</Text>
        <Text>
            بسیار خوشحالیم که به جامعه نویسندگان و خوانندگان ما پیوستید. در روانیک، شما می‌توانید داستان‌ها و دانش خود را با دیگران به اشتراک بگذارید و از بهترین مقالات فارسی لذت ببرید.
        </Text>
        <Text>برای شروع، می‌توانید اولین مقاله خود را بنویسید:</Text>
        <Button
            href={`${process.env.NEXT_PUBLIC_BASE_URL}/write`}
            style={{
                backgroundColor: '#4CAF50',
                color: 'white',
                padding: '12px 20px',
                borderRadius: '5px',
                textDecoration: 'none',
            }}
        >
            نوشتن اولین مقاله
        </Button>
        <Hr />
        <Text>با احترام،</Text>
        <Text>تیم روانیک</Text>
    </Html>
);