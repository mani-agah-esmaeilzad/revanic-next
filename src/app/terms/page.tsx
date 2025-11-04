import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { buildStaticMetadata } from "@/lib/page-metadata";

export const metadata = buildStaticMetadata({
  title: "شرایط استفاده روانک",
  description: "قوانین و مقررات استفاده از مجله روانک و تعهدات کاربران و ناشر را بخوانید.",
  path: "/terms",
  keywords: ["شرایط استفاده روانک", "قوانین سایت روانک", "قوانین مجله"],
});

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">

      
      {/* Hero Section */}
      <section className="py-16 bg-journal-cream/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <FileText className="h-16 w-16 text-journal-green mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-journal mb-4">
              شرایط استفاده
            </h1>
            <p className="text-xl text-journal-light">
              قوانین و مقررات استفاده از مجله روانک
            </p>
          </div>
        </div>
      </section>

      {/* Terms Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="shadow-soft border-0">
              <CardContent className="p-8">
                <div className="space-y-8">
                  
                  <div>
                    <h2 className="text-2xl font-bold text-journal mb-4">۱. پذیرش شرایط</h2>
                    <div className="text-journal-light space-y-4">
                      <p>
                        با دسترسی و استفاده از وب‌سایت مجله روانک، شما موافقت خود را با این شرایط و قوانین اعلام می‌کنید. اگر با این شرایط موافق نیستید، لطفاً از استفاده از وب‌سایت خودداری کنید.
                      </p>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold text-journal mb-4">۲. تعاریف</h2>
                    <div className="text-journal-light space-y-4">
                      <ul className="pr-6 space-y-2">
                        <li>• <strong>مجله:</strong> وب‌سایت مجله روانک و تمام خدمات مرتبط با آن</li>
                        <li>• <strong>کاربر:</strong> هر شخصی که از خدمات مجله استفاده می‌کند</li>
                        <li>• <strong>محتوا:</strong> تمام متن‌ها، تصاویر، ویدیوها و سایر مطالب منتشر شده</li>
                        <li>• <strong>خدمات:</strong> تمام امکانات و سرویس‌های ارائه شده توسط مجله</li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold text-journal mb-4">۳. حساب کاربری</h2>
                    <div className="text-journal-light space-y-4">
                      <h3 className="text-lg font-semibold text-journal">شرایط ثبت‌نام:</h3>
                      <ul className="pr-6 space-y-2">
                        <li>• ارائه اطلاعات صحیح و کامل</li>
                        <li>• حداقل سن ۱۳ سال برای ثبت‌نام</li>
                        <li>• مسئولیت حفظ امنیت رمز عبور</li>
                        <li>• اطلاع‌رسانی فوری در صورت سوء استفاده از حساب</li>
                      </ul>
                      
                      <h3 className="text-lg font-semibold text-journal mt-6">مسئولیت‌های کاربر:</h3>
                      <ul className="pr-6 space-y-2">
                        <li>• استفاده قانونی از حساب کاربری</li>
                        <li>• عدم اشتراک‌گذاری اطلاعات ورود با دیگران</li>
                        <li>• اطلاع‌رسانی به موقع در صورت تغییر اطلاعات</li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold text-journal mb-4">۴. محتوا و کپی‌رایت</h2>
                    <div className="text-journal-light space-y-4">
                      <h3 className="text-lg font-semibold text-journal">حقوق محتوا:</h3>
                      <ul className="pr-6 space-y-2">
                        <li>• تمام محتوای منتشر شده دارای حق کپی‌رایت است</li>
                        <li>• استفاده از محتوا با ذکر منبع و کسب مجوز مجاز است</li>
                        <li>• کپی‌برداری بدون مجوز ممنوع است</li>
                      </ul>
                      
                      <h3 className="text-lg font-semibold text-journal mt-6">محتوای ارسالی کاربران:</h3>
                      <ul className="pr-6 space-y-2">
                        <li>• مسئولیت صحت و قانونی بودن محتوا با نویسنده است</li>
                        <li>• مجله حق ویرایش و حذف محتوا را دارد</li>
                        <li>• محتوا باید اصیل و غیرمنتشر شده باشد</li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold text-journal mb-4">۵. قوانین رفتار</h2>
                    <div className="text-journal-light space-y-4">
                      <h3 className="text-lg font-semibold text-journal">رفتارهای مجاز:</h3>
                      <ul className="pr-6 space-y-2">
                        <li>• احترام به سایر کاربران و نویسندگان</li>
                        <li>• ارسال نظرات سازنده و مرتبط</li>
                        <li>• استفاده مسئولانه از امکانات وب‌سایت</li>
                      </ul>
                      
                      <h3 className="text-lg font-semibold text-journal mt-6">رفتارهای ممنوع:</h3>
                      <ul className="pr-6 space-y-2">
                        <li>• انتشار محتوای توهین‌آمیز یا نامناسب</li>
                        <li>• تبلیغات غیرمجاز یا اسپم</li>
                        <li>• نقض حریم خصوصی دیگران</li>
                        <li>• انتشار اطلاعات کذب یا گمراه‌کننده</li>
                        <li>• سوء استفاده از آسیب‌پذیری‌های امنیتی</li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold text-journal mb-4">۶. اشتراک و پرداخت</h2>
                    <div className="text-journal-light space-y-4">
                      <ul className="pr-6 space-y-2">
                        <li>• قیمت‌ها ممکن است بدون اطلاع قبلی تغییر کنند</li>
                        <li>• پرداخت‌ها غیرقابل استرداد هستند مگر در موارد خاص</li>
                        <li>• لغو اشتراک تا پایان دوره فعلی امکان‌پذیر است</li>
                        <li>• تمدید خودکار اشتراک انجام می‌شود مگر اینکه لغو شود</li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold text-journal mb-4">۷. مسئولیت‌ها</h2>
                    <div className="text-journal-light space-y-4">
                      <h3 className="text-lg font-semibold text-journal">مسئولیت مجله:</h3>
                      <ul className="pr-6 space-y-2">
                        <li>• ارائه خدمات با کیفیت مطلوب</li>
                        <li>• حفظ امنیت اطلاعات کاربران</li>
                        <li>• پشتیبانی مناسب از کاربران</li>
                      </ul>
                      
                      <h3 className="text-lg font-semibold text-journal mt-6">محدودیت مسئولیت:</h3>
                      <ul className="pr-6 space-y-2">
                        <li>• عدم مسئولیت در قبال خسارات غیرمستقیم</li>
                        <li>• عدم تضمین دسترسی ۲۴/۷ به خدمات</li>
                        <li>• عدم مسئولیت در قبال محتوای ارسالی کاربران</li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold text-journal mb-4">۸. تعلیق و خاتمه</h2>
                    <div className="text-journal-light space-y-4">
                      <p>
                        ما حق تعلیق یا حذف حساب‌های کاربری را در موارد زیر داریم:
                      </p>
                      <ul className="pr-6 space-y-2">
                        <li>• نقض این شرایط استفاده</li>
                        <li>• فعالیت‌های مخرب یا غیرقانونی</li>
                        <li>• درخواست خود کاربر</li>
                        <li>• عدم استفاده طولانی‌مدت از حساب</li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold text-journal mb-4">۹. تغییرات</h2>
                    <div className="text-journal-light">
                      <p>
                        ما حق تغییر این شرایط را محفوظ می‌داریم. تغییرات مهم از طریق ایمیل یا اعلان در وب‌سایت اطلاع‌رسانی خواهد شد. ادامه استفاده از خدمات پس از اعلام تغییرات، به منزله پذیرش شرایط جدید است.
                      </p>
                    </div>
                  </div>

                  <div className="bg-journal-cream/30 p-6 rounded-lg">
                    <p className="text-journal text-sm">
                      <strong>تاریخ آخرین به‌روزرسانی:</strong> ۱۴۰۳/۰۹/۱۲
                    </p>
                    <p className="text-journal-light text-sm mt-2">
                      برای سوالات یا وضاحت بیشتر در مورد این شرایط، با ما تماس بگیرید: info@revanac.ir
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

export default Terms;
