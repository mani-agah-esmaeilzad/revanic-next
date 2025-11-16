import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Users, Target, Award, Heart, Lightbulb } from "lucide-react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { buildStaticMetadata } from "@/lib/page-metadata";

export const metadata = buildStaticMetadata({
  title: "درباره مجله روانک",
  description:
    "با داستان شکل‌گیری، ارزش‌ها و تیم مجله روانک آشنا شوید؛ خانه‌ای برای نویسندگان و خوانندگان فارسی‌زبان.",
  path: "/about",
  keywords: ["درباره روانک", "مجله روانک", "معرفی روانک"],
});

const About = () => {
    const values = [
        {
            icon: BookOpen,
            title: "کیفیت محتوا",
            description: "ما بر کیفیت بالای مقالات و محتوای ارزشمند تأکید داریم. هر مقاله با دقت بررسی و ویرایش می‌شود."
        },
        {
            icon: Users,
            title: "جامعه‌محوری",
            description: "مجله روانک متعلق به جامعه نویسندگان و خوانندگان فارسی‌زبان است. ما صدای همه را می‌شنویم."
        },
        {
            icon: Target,
            title: "تنوع موضوعی",
            description: "از فناوری تا هنر، از علم تا فرهنگ، ما پلتفرمی برای همه علایق و حوزه‌های دانش فراهم کرده‌ایم."
        },
        {
            icon: Award,
            title: "تعالی و بهبود",
            description: "ما همواره در تلاش برای بهبود و ارتقای کیفیت خدمات و تجربه کاربری هستیم."
        }
    ];

    const team = [
        {
            name: "مانی آگاه",
            role: "بنیانگذار و مدیر عامل",
            description: "مهندس نرم افزار و متخصص هوش مصنوعی"
        },
        {
            name: "آرمین رستمی",
            role: "برنامه نویس وب",
            description: "برنامه نویس فول استک"
        },
        {
            name: "مهران رضائیان",
            role: "متخصص سئو",
            description: "متخصص سئو"
        }
    ];

    return (
        <div className="min-h-screen bg-background">

            {/* Hero Section */}
            <section className="py-20 bg-gradient-to-bl from-journal-cream via-background to-journal-cream/50">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="mb-8">
                            <Logo size="xl" className="justify-center mb-6" />
                        </div>

                        <h1 className="text-4xl md:text-5xl font-bold text-journal mb-6 leading-tight">
                            داستان مجله روانک
                        </h1>

                        <p className="text-xl text-journal-light max-w-3xl mx-auto leading-relaxed">
                            مجله روانک با هدف ایجاد فضایی برای اشتراک دانش و تجربیات نویسندگان فارسی‌زبان
                            در سال ۱۴۰۴ تأسیس شد. ما معتقدیم که هر فردی داستانی برای گفتن دارد.
                        </p>
                    </div>
                </div>
            </section>

            {/* Mission & Vision */}
            <section className="py-16">
                <div className="container mx-auto px-4">
                    <div className="max-w-6xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">

                            {/* Mission */}
                            <Card className="shadow-soft border-0">
                                <CardContent className="p-8">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-3 bg-journal-green text-white rounded-lg">
                                            <Heart className="h-6 w-6" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-journal">ماموریت ما</h3>
                                    </div>
                                    <p className="text-journal-light leading-relaxed">
                                        ما در تلاش هستیم تا پلتفرمی فراهم کنیم که در آن نویسندگان فارسی‌زبان
                                        بتوانند آزادانه و بدون محدودیت، دانش، تجربیات و دیدگاه‌های خود را با
                                        جامعه به اشتراک بگذارند و خوانندگان نیز دسترسی آسان به محتوای باکیفیت
                                        و متنوع داشته باشند.
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Vision */}
                            <Card className="shadow-soft border-0">
                                <CardContent className="p-8">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-3 bg-journal-orange text-white rounded-lg">
                                            <Lightbulb className="h-6 w-6" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-journal">چشم‌انداز ما</h3>
                                    </div>
                                    <p className="text-journal-light leading-relaxed">
                                        تبدیل شدن به بزرگ‌ترین و معتبرترین پلتفرم انتشار محتوای فارسی در دنیا،
                                        جایی که نسل جدید نویسندگان و متفکران ایرانی بتوانند صدای خود را به گوش
                                        جهان برسانند و در ایجاد گفتمان سازنده و علمی نقش فعال داشته باشند.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </section>

            {/* Values */}
            <section className="py-16 bg-journal-cream/30">
                <div className="container mx-auto px-4">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-journal mb-4">ارزش‌های ما</h2>
                            <p className="text-journal-light max-w-2xl mx-auto">
                                اصول و باورهایی که راه ما را در مجله روانک تعیین می‌کنند
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {values.map((value, index) => (
                                <Card key={index} className="shadow-soft border-0 text-center">
                                    <CardContent className="p-6">
                                        <div className="flex justify-center mb-4">
                                            <div className="p-3 bg-journal-green text-white rounded-lg">
                                                <value.icon className="h-6 w-6" />
                                            </div>
                                        </div>
                                        <h3 className="font-bold text-journal mb-3">{value.title}</h3>
                                        <p className="text-journal-light text-sm leading-relaxed">
                                            {value.description}
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Team */}
            <section className="py-16">
                <div className="container mx-auto px-4">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-journal mb-4">تیم ما</h2>
                            <p className="text-journal-light max-w-2xl mx-auto">
                                افرادی که با تلاش و عشق، مجله روانک را می‌سازند
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {team.map((member, index) => (
                                <Card key={index} className="shadow-soft border-0">
                                    <CardContent className="p-6 text-center">
                                        <div className="w-20 h-20 bg-journal-green text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                                            {member.name.charAt(0)}
                                        </div>
                                        <h3 className="font-bold text-journal mb-2">{member.name}</h3>
                                        <p className="text-journal-orange text-sm font-medium mb-3">{member.role}</p>
                                        <p className="text-journal-light text-sm leading-relaxed">
                                            {member.description}
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section className="py-16 bg-gradient-hero">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto text-center text-white">
                        <h2 className="text-3xl font-bold mb-12">مجله روانک در اعداد</h2>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                            <div>
                                <div className="text-4xl font-bold mb-2">۱۲۰۰+</div>
                                <p className="opacity-90">مقاله منتشر شده</p>
                            </div>
                            <div>
                                <div className="text-4xl font-bold mb-2">۳۵۰+</div>
                                <p className="opacity-90">نویسنده فعال</p>
                            </div>
                            <div>
                                <div className="text-4xl font-bold mb-2">۸۵۰۰+</div>
                                <p className="opacity-90">خواننده روزانه</p>
                            </div>
                            <div>
                                <div className="text-4xl font-bold mb-2">۳</div>
                                <p className="opacity-90">سال فعالیت</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-16">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="text-3xl font-bold text-journal mb-6">
                            با ما همراه شوید
                        </h2>
                        <p className="text-xl text-journal-light mb-8">
                            بخشی از داستان مجله روانک شوید و صدای خود را به گوش جهان برسانید
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href={`/register/`}>
                                <Button size="lg" className="bg-journal-green text-white hover:bg-journal-green-light">
                                    <Users className="ml-2 h-5 w-5" />
                                    عضویت رایگان
                                </Button>
                            </Link>
                            <Link href={`/contact/`}>
                                <Button variant="outline" size="lg" className="border-journal-green text-journal-green hover:bg-journal-green hover:text-white">
                                    تماس با ما
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default About;
