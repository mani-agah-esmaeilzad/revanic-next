// src/components/InstallPWAButton.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { X, Download } from "lucide-react";

// این اینترفیس برای تایپ صحیح event است
interface BeforeInstallPromptEvent extends Event {
    readonly platforms: Array<string>;
    readonly userChoice: Promise<{
        outcome: "accepted" | "dismissed";
        platform: string;
    }>;
    prompt(): Promise<void>;
}

export const InstallPWAButton = () => {
    const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            // بررسی می‌کنیم که آیا اپ قبلاً نصب نشده باشد
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
            if (!isStandalone) {
                setPrompt(e as BeforeInstallPromptEvent);
                setIsVisible(true);
            }
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!prompt) return;

        prompt.prompt();
        const { outcome } = await prompt.userChoice;

        if (outcome === "accepted") {
            console.log("User accepted the A2HS prompt");
        } else {
            console.log("User dismissed the A2HS prompt");
        }

        setPrompt(null);
        setIsVisible(false);
    };

    const handleDismissClick = () => {
        setIsVisible(false);
        // می‌توانید اینجا یک cookie یا آیتم در localStorage ست کنید
        // تا این پیام دیگر به این کاربر نمایش داده نشود
        localStorage.setItem('pwaInstallDismissed', 'true');
    };

    if (!isVisible) {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 left-4 z-50 animate-in slide-in-from-bottom-10 duration-500 md:left-auto">
            <div className="bg-background border shadow-lg rounded-lg p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Download className="h-8 w-8 text-primary" />
                    <div>
                        <p className="font-bold">نصب اپلیکیشن Revanic</p>
                        <p className="text-sm text-muted-foreground">
                            تجربه سریع‌تر و بهتر با افزودن به صفحه اصلی.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={handleInstallClick} size="sm">نصب</Button>
                    <Button onClick={handleDismissClick} variant="ghost" size="icon">
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
};