'use client';
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Phone, MapPin, Clock, Send, MessageCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Contact = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate form submission
    setTimeout(() => {
      setIsLoading(false);
      console.log("Contact form submitted:", { name, email, subject, message });
      // Reset form
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    }, 1500);
  };

  const contactInfo = [
    {
      icon: Mail,
      title: "ایمیل",
      content: "info@revanic.ir",
      description: "برای سوالات عمومی"
    },
    {
      icon: Phone,
      title: "تلفن",
      content: "۰۲۱-۱۲۳۴۵۶۷۸",
      description: "شنبه تا چهارشنبه، ۹ تا ۱۷"
    },
    {
      icon: MapPin,
      title: "آدرس",
      content: "تهران، خیابان ولیعصر",
      description: "دفتر مرکزی مجله روانیک"
    },
    {
      icon: Clock,
      title: "ساعات کاری",
      content: "۹:۰۰ - ۱۷:۰۰",
      description: "شنبه تا چهارشنبه"
    }
  ];

  const subjects = [
    "سوال عمومی",
    "پیشنهاد همکاری",
    "گزارش مشکل فنی",
    "درخواست مصاحبه",
    "پیشنهاد موضوع مقاله",
    "شکایت",
    "تبلیغات و بازاریابی",
    "سایر موضوعات"
  ];

  return (
    <div className="min-h-screen bg-background">


      {/* Hero Section */}
      <section className="py-16 bg-journal-cream/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-journal mb-4">
              تماس با ما
            </h1>
            <p className="text-xl text-journal-light mb-8">
              سوالات، پیشنهادات و نظرات خود را با تیم مجله روانیک در میان بگذارید
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

              {/* Contact Form */}
              <div className="lg:col-span-2">
                <Card className="shadow-medium border-0">
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold text-journal flex items-center gap-2">
                      <MessageCircle className="h-6 w-6 text-journal-green" />
                      پیام خود را ارسال کنید
                    </CardTitle>
                    <p className="text-journal-light">
                      تیم ما در کمترین زمان ممکن به پیام شما پاسخ خواهد داد
                    </p>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-journal">نام و نام خانوادگی</label>
                          <Input
                            placeholder="نام کامل خود را وارد کنید"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-journal">ایمیل</label>
                          <Input
                            type="email"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-journal">موضوع</label>
                        <Select value={subject} onValueChange={setSubject}>
                          <SelectTrigger>
                            <SelectValue placeholder="موضوع پیام خود را انتخاب کنید" />
                          </SelectTrigger>
                          <SelectContent>
                            {subjects.map((subj) => (
                              <SelectItem key={subj} value={subj}>
                                {subj}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-journal">پیام</label>
                        <Textarea
                          placeholder="پیام خود را اینجا بنویسید..."
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          className="min-h-32"
                          required
                        />
                      </div>

                      <Button
                        type="submit"
                        size="lg"
                        className="w-full bg-journal-green text-white hover:bg-journal-green-light"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          "در حال ارسال..."
                        ) : (
                          <>
                            <Send className="ml-2 h-4 w-4" />
                            ارسال پیام
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Contact Info */}
              <div className="space-y-6">
                <Card className="shadow-soft border-0">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-journal">
                      اطلاعات تماس
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {contactInfo.map((info, index) => (
                      <div key={index} className="flex items-start gap-4">
                        <div className="p-3 bg-journal-green text-white rounded-lg flex-shrink-0">
                          <info.icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-journal mb-1">{info.title}</h3>
                          <p className="text-journal font-medium mb-1">{info.content}</p>
                          <p className="text-journal-light text-sm">{info.description}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="shadow-soft border-0">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-journal">
                      دسترسی سریع
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full justify-start border-journal-green/20 hover:bg-journal-green hover:text-white"
                    >
                      <Mail className="ml-2 h-4 w-4" />
                      ارسال ایمیل مستقیم
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start border-journal-green/20 hover:bg-journal-green hover:text-white"
                    >
                      <MessageCircle className="ml-2 h-4 w-4" />
                      چت آنلاین
                    </Button>
                  </CardContent>
                </Card>

                {/* FAQ Link */}
                <Card className="shadow-soft border-0 bg-journal-cream/50">
                  <CardContent className="p-6 text-center">
                    <h3 className="font-bold text-journal mb-2">
                      سوالات متداول
                    </h3>
                    <p className="text-journal-light text-sm mb-4">
                      شاید پاسخ سوال شما در بخش سوالات متداول موجود باشد
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-journal-green text-journal-green hover:bg-journal-green hover:text-white"
                    >
                      مشاهده سوالات متداول
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Office Location */}
      <section className="py-16 bg-journal-cream/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-journal mb-8">
              محل دفتر ما
            </h2>
            <div className="bg-journal-green/10 rounded-lg p-8 mb-8">
              <div className="w-full h-64 bg-journal-green/20 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="h-12 w-12 text-journal-green mx-auto mb-4" />
                  <p className="text-journal font-medium">نقشه دفتر مجله روانیک</p>
                  <p className="text-journal-light text-sm mt-2">تهران، خیابان ولیعصر</p>
                </div>
              </div>
            </div>
            <p className="text-journal-light">
              برای ملاقات حضوری، لطفاً از قبل وقت بگیرید تا بتوانیم بهترین خدمات را به شما ارائه دهیم.
            </p>
          </div>
        </div>
      </section>


    </div>
  );
};

export default Contact;