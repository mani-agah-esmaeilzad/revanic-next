"use client";

import { useState } from "react";
import { Mail, Phone, MapPin, Clock, Send, MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const subjects = [
  "سوال عمومی",
  "پیشنهاد همکاری",
  "گزارش مشکل فنی",
  "درخواست مصاحبه",
  "پیشنهاد موضوع مقاله",
  "شکایت",
  "تبلیغات و بازاریابی",
  "سایر موضوعات",
];

const contactInfo = [
  {
    icon: Mail,
    title: "ایمیل",
    content: "info@revanac.ir",
    description: "برای سوالات عمومی",
  },
  {
    icon: Phone,
    title: "تلفن",
    content: "۰۲۱-۱۲۳۴۵۶۷۸",
    description: "شنبه تا چهارشنبه، ۹ تا ۱۷",
  },
  {
    icon: MapPin,
    title: "آدرس",
    content: "تهران، خیابان ولیعصر",
    description: "دفتر مرکزی مجله روانک",
  },
  {
    icon: Clock,
    title: "ساعات کاری",
    content: "۹:۰۰ - ۱۷:۰۰",
    description: "شنبه تا چهارشنبه",
  },
];

export const ContactPageClient = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      console.log("Contact form submitted:", { name, email, subject, message });
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-journal-cream/30 py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="mb-4 text-4xl font-bold text-journal">تماس با ما</h1>
            <p className="text-xl text-journal-light">
              سوالات، پیشنهادات و نظرات خود را با تیم مجله روانک در میان بگذارید
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-6xl">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <Card className="border-0 shadow-medium">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl font-bold text-journal">
                      <MessageCircle className="h-6 w-6 text-journal-green" />
                      پیام خود را ارسال کنید
                    </CardTitle>
                    <p className="text-journal-light">تیم ما در کمترین زمان ممکن به پیام شما پاسخ خواهد داد</p>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-journal">نام و نام خانوادگی</label>
                          <Input
                            placeholder="نام کامل خود را وارد کنید"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-journal">ایمیل</label>
                          <Input
                            type="email"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
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
                            {subjects.map((item) => (
                              <SelectItem key={item} value={item}>
                                {item}
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
                          onChange={(event) => setMessage(event.target.value)}
                          className="min-h-32"
                          required
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-journal-green text-white hover:bg-journal-green-light"
                      >
                        {isLoading ? "در حال ارسال..." : <Send className="ml-2 h-4 w-4" />}
                        {isLoading ? "" : "ارسال پیام"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                {contactInfo.map((item) => (
                  <Card key={item.title} className="border-0 bg-white/90 shadow-soft">
                    <CardContent className="flex items-start gap-4 p-6">
                      <div className="rounded-full bg-journal-green/10 p-3">
                        <item.icon className="h-6 w-6 text-journal-green" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-journal">{item.title}</h3>
                        <p className="text-base text-journal-light">{item.content}</p>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPageClient;
