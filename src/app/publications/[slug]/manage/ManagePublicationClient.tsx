"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { UserPlus, Trash2, Crown, Loader2 } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";

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
  email: z.string().email("لطفاً یک ایمیل معتبر وارد کنید."),
});

type InviteFormData = z.infer<typeof inviteSchema>;

const fetchPublicationDetails = async (slug: string): Promise<PublicationData> => {
  const response = await fetch(`/api/publications/${slug}/manage`);
  if (!response.ok) {
    throw new Error("خطا در دریافت اطلاعات یا عدم دسترسی.");
  }
  return response.json();
};

const inviteUser = async ({ slug, email }: { slug: string; email: string }) => {
  const response = await fetch(`/api/publications/${slug}/members`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error ?? "خطا در ارسال دعوت‌نامه.");
  }
  return response.json();
};

const removeUser = async ({ slug, userId }: { slug: string; userId: number }) => {
  const response = await fetch(`/api/publications/${slug}/members/${userId}`, { method: "DELETE" });
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error ?? "خطا در حذف کاربر.");
  }
  return { userId };
};

interface ManagePublicationClientProps {
  slug: string;
}

export const ManagePublicationClient = ({ slug }: ManagePublicationClientProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: publication, isLoading, isError } = useQuery<PublicationData>({
    queryKey: ["publication-manage", slug],
    queryFn: () => fetchPublicationDetails(slug),
  });

  const form = useForm<InviteFormData>({ resolver: zodResolver(inviteSchema) });
  const inviteMutation = useMutation({
    mutationFn: inviteUser,
    onSuccess: () => {
      toast({ title: "موفقیت", description: "دعوت‌نامه برای کاربر ارسال شد." });
      queryClient.invalidateQueries({ queryKey: ["publication-manage", slug] });
      form.reset();
    },
    onError: (error: Error) => {
      toast({ title: "خطا", description: error.message, variant: "destructive" });
    },
  });

  const onInviteSubmit: SubmitHandler<InviteFormData> = ({ email }) => {
    inviteMutation.mutate({ slug, email });
  };

  const removeMutation = useMutation({
    mutationFn: removeUser,
    onSuccess: () => {
      toast({ title: "موفقیت", description: "کاربر با موفقیت حذف شد." });
      queryClient.invalidateQueries({ queryKey: ["publication-manage", slug] });
    },
    onError: (error: Error) => {
      toast({ title: "خطا", description: error.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <Skeleton className="mb-8 h-10 w-1/4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !publication) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8 text-center text-red-500">
        خطا در بارگذاری اطلاعات. ممکن است شما دسترسی لازم برای مدیریت این نشریه را نداشته باشید.
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold mb-2">مدیریت نشریه</h1>
        <p className="text-xl text-muted-foreground mb-6">{publication.name}</p>

        <Tabs defaultValue="members" className="w-full">
          <TabsList>
            <TabsTrigger value="members">اعضا</TabsTrigger>
            <TabsTrigger value="articles" disabled>
              مقالات
            </TabsTrigger>
            <TabsTrigger value="settings" disabled>
              تنظیمات
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members">
            <Card>
              <CardHeader>
                <CardTitle>مدیریت اعضا</CardTitle>
                <CardDescription>نویسندگان جدید را دعوت کرده و نقش‌های اعضای فعلی را مدیریت کنید.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={form.handleSubmit(onInviteSubmit)} className="flex flex-col gap-4 md:flex-row">
                  <Input
                    type="email"
                    placeholder="ایمیل نویسنده جدید"
                    {...form.register("email")}
                    className="md:flex-1"
                  />
                  <Button type="submit" disabled={inviteMutation.isPending}>
                    {inviteMutation.isPending ? (
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="ml-2 h-4 w-4" />
                    )}
                    ارسال دعوت‌نامه
                  </Button>
                </form>
                {form.formState.errors.email ? (
                  <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
                ) : null}

                <div className="space-y-4">
                  {publication.members.map((member) => (
                    <div
                      key={member.user.id}
                      className="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={member.user.avatarUrl ?? ""} />
                          <AvatarFallback>{member.user.name?.charAt(0) ?? "?"}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.user.name ?? "کاربر"}</p>
                          <p className="text-sm text-muted-foreground">
                            {member.role === "OWNER" ? "مدیر نشریه" : "نویسنده"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {member.role === "OWNER" ? (
                          <span className="flex items-center gap-1 rounded-full bg-journal-green/10 px-3 py-1 text-sm text-journal-green">
                            <Crown className="h-4 w-4" />
                            مالک
                          </span>
                        ) : (
                          <Button
                            variant="ghost"
                            className="text-red-500 hover:text-red-600"
                            disabled={removeMutation.isPending}
                            onClick={() => removeMutation.mutate({ slug, userId: member.user.id })}
                          >
                            <Trash2 className="ml-2 h-4 w-4" />
                            حذف
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="articles">
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                مدیریت مقالات به زودی در دسترس قرار می‌گیرد.
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                تنظیمات پیشرفته نشریه به زودی فعال می‌شود.
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ManagePublicationClient;
