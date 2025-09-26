// src/app/publications/[slug]/manage/page.tsx
"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/components/ui/use-toast";
import { UserPlus, Trash2, Crown, Loader2 } from "lucide-react";

// =======================================================================
//  1. تعریف تایپ‌ها و Schema ها
// =======================================================================
type Member = {
    role: string;
    user: {
        id: number;
        name: string | null;
        avatarUrl: string | null;
    };
};

type PublicationData = {
    id: number;
    name: string;
    members: Member[];
};

const inviteSchema = z.object({
    email: z.string().email("لطفا یک ایمیل معتبر وارد کنید."),
});

type InviteFormData = z.infer<typeof inviteSchema>;

// =======================================================================
//  2. توابع Fetcher برای ارتباط با API
// =======================================================================
const fetchPublicationDetails = async (slug: string): Promise<PublicationData> => {
    const response = await fetch(`/api/publications/${slug}/manage`);
    if (!response.ok) {
        throw new Error("Failed to fetch publication details or you don't have permission.");
    }
    return response.json();
};

const inviteUser = async ({ slug, email }: { slug: string, email: string }) => {
    const response = await fetch(`/api/publications/${slug}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to invite user.");
    }
    return response.json();
};

const removeUser = async ({ slug, userId }: { slug: string, userId: number }) => {
    const response = await fetch(`/api/publications/${slug}/members/${userId}`, {
        method: "DELETE",
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to remove user.");
    }
    return { userId };
};


// =======================================================================
//  3. کامپوننت اصلی صفحه مدیریت
// =======================================================================
export default function ManagePublicationPage() {
    const params = useParams();
    const slug = params.slug as string;
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // دریافت اطلاعات نشریه و اعضا
    const { data: publication, isLoading, isError } = useQuery<PublicationData>({
        queryKey: ["publication-manage", slug],
        queryFn: () => fetchPublicationDetails(slug),
    });

    // --- مدیریت فرم دعوت ---
    const form = useForm<InviteFormData>({ resolver: zodResolver(inviteSchema) });
    const inviteMutation = useMutation({
        mutationFn: inviteUser,
        onSuccess: () => {
            toast({ title: "موفقیت", description: "دعوت‌نامه برای کاربر ارسال شد." });
            queryClient.invalidateQueries({ queryKey: ["publication-manage", slug] });
            form.reset();
        },
        onError: (error) => {
            toast({ title: "خطا", description: error.message, variant: "destructive" });
        },
    });
    const onInviteSubmit: SubmitHandler<InviteFormData> = ({ email }) => {
        inviteMutation.mutate({ slug, email });
    };

    // --- مدیریت حذف کاربر ---
    const removeMutation = useMutation({
        mutationFn: removeUser,
        onSuccess: () => {
            toast({ title: "موفقیت", description: "کاربر با موفقیت حذف شد." });
            queryClient.invalidateQueries({ queryKey: ["publication-manage", slug] });
        },
        onError: (error) => {
            toast({ title: "خطا", description: error.message, variant: "destructive" });
        }
    });


    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <Skeleton className="h-10 w-1/4 mb-8" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-4xl text-center text-red-500">
                خطا در بارگذاری اطلاعات. ممکن است شما دسترسی لازم برای مدیریت این نشریه را نداشته باشید.
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-2">مدیریت نشریه</h1>
                <p className="text-muted-foreground text-xl mb-6">{publication?.name}</p>

                <Tabs defaultValue="members" className="w-full">
                    <TabsList>
                        <TabsTrigger value="members">اعضا</TabsTrigger>
                        <TabsTrigger value="articles" disabled>مقالات</TabsTrigger>
                        <TabsTrigger value="settings" disabled>تنظیمات</TabsTrigger>
                    </TabsList>

                    {/* تب مدیریت اعضا */}
                    <TabsContent value="members">
                        <Card>
                            <CardHeader>
                                <CardTitle>مدیریت اعضا</CardTitle>
                                <CardDescription>
                                    نویسندگان جدید را دعوت کرده و نقش‌های اعضای فعلی را مدیریت کنید.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* فرم دعوت */}
                                <form onSubmit={form.handleSubmit(onInviteSubmit)} className="flex gap-2">
                                    <Input {...form.register("email")} placeholder="ایمیل کاربر برای دعوت" />
                                    <Button type="submit" disabled={inviteMutation.isPending}>
                                        {inviteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                                    </Button>
                                </form>
                                {form.formState.errors.email && <p className="text-sm text-red-500 mt-1">{form.formState.errors.email.message}</p>}

                                {/* لیست اعضا */}
                                <div className="space-y-4">
                                    {publication?.members.map((member) => (
                                        <div key={member.user.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                                            <div className="flex items-center gap-3">
                                                <Avatar>
                                                    <AvatarImage src={member.user.avatarUrl || ''} />
                                                    <AvatarFallback>{member.user.name?.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-semibold">{member.user.name}</p>
                                                    <p className="text-sm text-muted-foreground">{member.role}</p>
                                                </div>
                                            </div>
                                            {member.role !== "OWNER" && (
                                                <Button variant="ghost" size="icon" onClick={() => removeMutation.mutate({ slug, userId: member.user.id })}>
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            )}
                                            {member.role === "OWNER" && (
                                                <Crown className="h-5 w-5 text-yellow-500" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}