'use-client';
import { Card, CardContent } from "@/components/ui/card";
import { Shield } from "lucide-react";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      
      {/* Hero Section */}
      <section className="py-16 bg-journal-cream/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Shield className="h-16 w-16 text-journal-green mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-journal mb-4">
              حریم خصوصی
            </h1>
            <p className="text-xl text-journal-light">
              مجله روانیک متعهد به حفظ حریم خصوصی کاربران خود است
            </p>
          </div>
        </div>
      </section>

      {/* Privacy Policy Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="shadow-soft border-0">
              <CardContent className="p-8">
                <div className="space-y-8">
                  
                  <div>
                    <h2 className="text-2xl font-bold text-journal mb-4">۱. جمع‌آوری اطلاعات</h2>
                    <div className="text-journal-light space-y-4">
                      <p>
                        ما اطلاعات شما را در موارد زیر جمع‌آوری می‌کنیم:
                      </p>
                      <ul className="pr-6 space-y-2">
                        <li>• هنگام ثبت‌نام در وب‌سایت</li>
                        <li>• هنگام اشتراک در خبرنامه</li>
                        <li>• هنگام ارسال نظرات یا مقالات</li>
                        <li>• از طریق کوکی‌ها و ابزارهای تحلیل وب</li>
                      </ul>
                      
                      <p>
                        اطلاعات جمع‌آوری شده شامل نام، ایمیل، اطلاعات پروفایل و ترجیحات خواندن شما است.
                      </p>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold text-journal mb-4">۲. استفاده از اطلاعات</h2>
                    <div className="text-journal-light space-y-4">
                      <p>
                        اطلاعات جمع‌آوری شده برای موارد زیر استفاده می‌شود:
                      </p>
                      <ul className="pr-6 space-y-2">
                        <li>• ارائه و بهبود خدمات مجله</li>
                        <li>• ارسال خبرنامه و اطلاعیه‌های مهم</li>
                        <li>• شخصی‌سازی محتوا براساس علایق شما</li>
                        <li>• پشتیبانی از کاربران</li>
                        <li>• تحلیل و بهبود عملکرد وب‌سایت</li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold text-journal mb-4">۳. حفاظت از اطلاعات</h2>
                    <div className="text-journal-light space-y-4">
                      <p>
                        ما از روش‌های مختلف امنیتی برای حفاظت از اطلاعات شما استفاده می‌کنیم:
                      </p>
                      <ul className="pr-6 space-y-2">
                        <li>• رمزگذاری SSL برای انتقال اطلاعات</li>
                        <li>• محافظت فیزیکی از سرورها</li>
                        <li>• محدود کردن دسترسی به اطلاعات حساس</li>
                        <li>• به‌روزرسانی مداوم سیستم‌های امنیتی</li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold text-journal mb-4">۴. اشتراک‌گذاری اطلاعات</h2>
                    <div className="text-journal-light space-y-4">
                      <p>
                        ما اطلاعات شخصی شما را با اشخاص ثالث به اشتراک نمی‌گذاریم، مگر در موارد زیر:
                      </p>
                      <ul className="pr-6 space-y-2">
                        <li>• با رضایت صریح شما</li>
                        <li>• برای ارائه خدمات درخواستی توسط شما</li>
                        <li>• در صورت الزام قانونی</li>
                        <li>• برای محافظت از حقوق و امنیت مجله</li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold text-journal mb-4">۵. کوکی‌ها</h2>
                    <div className="text-journal-light space-y-4">
                      <p>
                        ما از کوکی‌ها برای بهبود تجربه کاربری استفاده می‌کنیم. کوکی‌ها برای موارد زیر استفاده می‌شوند:
                      </p>
                      <ul className="pr-6 space-y-2">
                        <li>• ذخیره تنظیمات کاربر</li>
                        <li>• تحلیل ترافیک وب‌سایت</li>
                        <li>• شخصی‌سازی محتوا</li>
                        <li>• بهبود عملکرد وب‌سایت</li>
                      </ul>
                      <p>
                        شما می‌توانید کوکی‌ها را از طریق تنظیمات مرورگر خود مدیریت کنید.
                      </p>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold text-journal mb-4">۶. حقوق کاربران</h2>
                    <div className="text-journal-light space-y-4">
                      <p>
                        شما حقوق زیر را در رابطه با اطلاعات شخصی‌تان دارید:
                      </p>
                      <ul className="pr-6 space-y-2">
                        <li>• دسترسی به اطلاعات ذخیره شده</li>
                        <li>• اصلاح یا به‌روزرسانی اطلاعات</li>
                        <li>• حذف اطلاعات شخصی</li>
                        <li>• لغو اشتراک در خبرنامه</li>
                        <li>• تغییر تنظیمات حریم خصوصی</li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold text-journal mb-4">۷. تماس با ما</h2>
                    <div className="text-journal-light">
                      <p>
                        اگر سوالی در مورد این سیاست حریم خصوصی دارید، می‌توانید از طریق راه‌های زیر با ما تماس بگیرید:
                      </p>
                      <ul className="pr-6 space-y-2 mt-4">
                        <li>• ایمیل: privacy@revanic.ir</li>
                        <li>• تلفن: ۰۲۱-۱۲۳۴۵۶۷۸</li>
                        <li>• صفحه تماس با ما در وب‌سایت</li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-journal-cream/30 p-6 rounded-lg">
                    <p className="text-journal text-sm">
                      <strong>تاریخ آخرین به‌روزرسانی:</strong> ۱۴۰۳/۰۹/۱۲
                    </p>
                    <p className="text-journal-light text-sm mt-2">
                      ما ممکن است این سیاست حریم خصوصی را به‌روزرسانی کنیم. در صورت تغییرات مهم، از طریق ایمیل یا اعلان در وب‌سایت به شما اطلاع خواهیم داد.
                    </p>
                  </div>

                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Privacy;