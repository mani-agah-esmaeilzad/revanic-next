// src/app/publications/new/page.tsx
"use client";

import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2 } from "lucide-react";

// 1. تعریف Schema برای اعتبارسنجی فرم
const publicationSchema = z.object({
    name: z.string().min(3, "نام نشریه باید حداقل ۳ کاراکتر باشد.").max(50, "نام نشریه بیش از حد طولانی است."),
    description: z.string().max(200, "توضیحات بیش از حد طولانی است.").optional(),
});

type PublicationFormData = z.infer<typeof publicationSchema>;

// 2. تابع برای ارسال داده به API
const createPublication = async (data: PublicationFormData) => {
    const response = await fetch("/api/publications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create publication");
    }

    return response.json();
};


export default function NewPublicationPage() {
    const router = useRouter();
    const { toast } = useToast();
    const form = useForm<PublicationFormData>({
        resolver: zodResolver(publicationSchema),
        defaultValues: { name: "", description: "" },
    });

    const mutation = useMutation({
        mutationFn: createPublication,
        onSuccess: (data) => {
            toast({ title: "موفقیت", description: "نشریه شما با موفقیت ساخته شد." });
            router.push(`/publications/${data.slug}`); // انتقال به صفحه نشریه جدید
        },
        onError: (error) => {
            toast({ title: "خطا", description: error.message, variant: "destructive" });
        },
    });

    const onSubmit: SubmitHandler<PublicationFormData> = (data) => {
        mutation.mutate(data);
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl">ساخت نشریه جدید</CardTitle>
                        <CardDescription>
                            یک فضای جدید برای همکاری و انتشار محتوای گروهی ایجاد کنید.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>نام نشریه</FormLabel>
                                            <FormControl>
                                                <Input placeholder="مثال: باشگاه برنامه‌نویسان" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>توضیحات (اختیاری)</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="یک توضیح کوتاه درباره موضوع و هدف نشریه شما"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" disabled={mutation.isPending} className="w-full">
                                    {mutation.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                                    ایجاد نشریه
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}