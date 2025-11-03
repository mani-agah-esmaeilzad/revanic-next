import { Card, CardContent } from "@/components/ui/card";
import { PenTool, BookOpen, Users, Star } from "lucide-react";

const AuthorsGuide = () => {
    return (
        <div className="min-h-screen bg-background">

            {/* Hero Section */}
            <section className="py-16 bg-journal-cream/30">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto text-center">
                        <PenTool className="h-16 w-16 text-journal-green mx-auto mb-6" />
                        <h1 className="text-4xl font-bold text-journal mb-4">
                            راهنمای نویسندگان
                        </h1>
                        <p className="text-xl text-journal-light">
                            همه چیزهایی که برای شروع نوشتن در مجله روانک نیاز دارید
                        </p>
                    </div>
                </div>
            </section>

            {/* Guidelines */}
            <section className="py-16">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                            <Card className="text-center shadow-soft border-0">
                                <CardContent className="p-6">
                                    <BookOpen className="h-12 w-12 text-journal-green mx-auto mb-4" />
                                    <h3 className="font-bold text-journal mb-2">محتوای با کیفیت</h3>
                                    <p className="text-journal-light text-sm">
                                        مقالات خود را با دقت و تحقیق کامل بنویسید
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="text-center shadow-soft border-0">
                                <CardContent className="p-6">
                                    <Users className="h-12 w-12 text-journal-orange mx-auto mb-4" />
                                    <h3 className="font-bold text-journal mb-2">تعامل با خوانندگان</h3>
                                    <p className="text-journal-light text-sm">
                                        به نظرات و سوالات خوانندگان پاسخ دهید
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="text-center shadow-soft border-0">
                                <CardContent className="p-6">
                                    <Star className="h-12 w-12 text-journal-green mx-auto mb-4" />
                                    <h3 className="font-bold text-journal mb-2">اصالت محتوا</h3>
                                    <p className="text-journal-light text-sm">
                                        محتوای اصیل و منحصر به فرد تولید کنید
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Detailed Guidelines */}
                        <div className="space-y-8">
                            <Card className="shadow-soft border-0">
                                <CardContent className="p-8">
                                    <h2 className="text-2xl font-bold text-journal mb-6">قوانین نگارش</h2>

                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-xl font-bold text-journal mb-3">۱. انتخاب موضوع</h3>
                                            <ul className="text-journal-light space-y-2 pr-6">
                                                <li>• موضوعات مرتبط با روانشناسی، سلامت روان و رفاه اجتماعی</li>
                                                <li>• محتوای آموزشی و کاربردی برای خوانندگان</li>
                                                <li>• تحقیقات جدید و یافته‌های علمی معتبر</li>
                                                <li>• تجربیات شخصی و مطالعات موردی (با رعایت حریم خصوصی)</li>
                                            </ul>
                                        </div>

                                        <div>
                                            <h3 className="text-xl font-bold text-journal mb-3">۲. ساختار مقاله</h3>
                                            <ul className="text-journal-light space-y-2 pr-6">
                                                <li>• عنوان جذاب و توصیفی (حداکثر ۶۰ کاراکتر)</li>
                                                <li>• مقدمه‌ای که موضوع را معرفی کند</li>
                                                <li>• بدنه مقاله با بخش‌بندی منطقی</li>
                                                <li>• نتیجه‌گیری و خلاصه نکات کلیدی</li>
                                                <li>• منابع و مراجع معتبر</li>
                                            </ul>
                                        </div>

                                        <div>
                                            <h3 className="text-xl font-bold text-journal mb-3">۳. استانداردهای نگارشی</h3>
                                            <ul className="text-journal-light space-y-2 pr-6">
                                                <li>• استفاده از زبان فارسی صحیح و روان</li>
                                                <li>• رعایت قوانین املا و نگارش</li>
                                                <li>• استفاده از جملات کوتاه و واضح</li>
                                                <li>• اجتناب از اصطلاحات پیچیده بدون توضیح</li>
                                            </ul>
                                        </div>

                                        <div>
                                            <h3 className="text-xl font-bold text-journal mb-3">۴. تصاویر و رسانه</h3>
                                            <ul className="text-journal-light space-y-2 pr-6">
                                                <li>• استفاده از تصاویر با کیفیت و مرتبط با موضوع</li>
                                                <li>• رعایت کپی‌رایت در استفاده از تصاویر</li>
                                                <li>• اضافه کردن توضیح مناسب برای تصاویر</li>
                                                <li>• امکان استفاده از نمودار و اینفوگرافیک</li>
                                            </ul>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="shadow-soft border-0">
                                <CardContent className="p-8">
                                    <h2 className="text-2xl font-bold text-journal mb-6">فرآیند انتشار</h2>

                                    <div className="space-y-4">
                                        <div className="flex items-start gap-4">
                                            <div className="w-8 h-8 bg-journal-green text-white rounded-full flex items-center justify-center text-sm font-bold">
                                                ۱
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-journal mb-1">ارسال مقاله</h4>
                                                <p className="text-journal-light text-sm">
                                                    مقاله خود را از طریق صفحه "نوشتن" ارسال کنید
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-4">
                                            <div className="w-8 h-8 bg-journal-green text-white rounded-full flex items-center justify-center text-sm font-bold">
                                                ۲
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-journal mb-1">بررسی ویرایشی</h4>
                                                <p className="text-journal-light text-sm">
                                                    تیم ویرایش مقاله را بررسی و در صورت نیاز پیشنهاد اصلاح ارائه می‌دهد
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-4">
                                            <div className="w-8 h-8 bg-journal-green text-white rounded-full flex items-center justify-center text-sm font-bold">
                                                ۳
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-journal mb-1">انتشار</h4>
                                                <p className="text-journal-light text-sm">
                                                    پس از تأیید نهایی، مقاله در مجله منتشر می‌شود
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-4">
                                            <div className="w-8 h-8 bg-journal-orange text-white rounded-full flex items-center justify-center text-sm font-bold">
                                                ۴
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-journal mb-1">تعامل با خوانندگان</h4>
                                                <p className="text-journal-light text-sm">
                                                    به نظرات و سوالات خوانندگان پاسخ دهید و تعامل برقرار کنید
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AuthorsGuide;