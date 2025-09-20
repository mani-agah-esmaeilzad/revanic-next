// src/components/PublicationCard.tsx
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, FileText } from 'lucide-react';

interface PublicationCardProps {
    name: string;
    slug: string;
    description: string | null;
    avatarUrl: string | null;
    membersCount: number;
    articlesCount: number;
}

export const PublicationCard = ({
    name,
    slug,
    description,
    avatarUrl,
    membersCount,
    articlesCount,
}: PublicationCardProps) => {
    return (
        <Link href={`/publications/${slug}`} className="block">
            <Card className="hover:shadow-lg transition-shadow duration-300 h-full">
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                            <AvatarImage src={avatarUrl || undefined} alt={name} />
                            <AvatarFallback className="bg-muted text-muted-foreground text-xl">
                                {name.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className="text-xl">{name}</CardTitle>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                                <div className="flex items-center gap-1">
                                    <Users className="h-4 w-4" />
                                    <span>{membersCount.toLocaleString('fa-IR')} عضو</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <FileText className="h-4 w-4" />
                                    <span>{articlesCount.toLocaleString('fa-IR')} مقاله</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <CardDescription className="line-clamp-3">
                        {description || `مجموعه‌ای از مقالات خواندنی در انتشارات ${name}`}
                    </CardDescription>
                </CardContent>
            </Card>
        </Link>
    );
};