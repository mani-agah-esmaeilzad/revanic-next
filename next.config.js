// next.config.js
const withPWA = require("next-pwa")({
    dest: "public",
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === "development", // PWA را در حالت توسعه غیرفعال می‌کند
});

/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "res.cloudinary.com",
                port: "",
                pathname: "/**",
            },
            // ! این بخش برای پشتیبانی از آپلود محلی اضافه شده است
            // در محیط توسعه، تصاویر از localhost بارگذاری می‌شوند
            {
                protocol: "http",
                hostname: "localhost",
                port: "3000", // یا هر پورتی که پروژه شما روی آن اجرا می‌شود
                pathname: "/uploads/**", // محدود کردن به پوشه آپلود
            },
        ],
    },
};

module.exports = withPWA(nextConfig);