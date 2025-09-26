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
            // اگر از منابع دیگری تصویر لود می‌کنید، اینجا اضافه کنید
        ],
    },
};

module.exports = withPWA(nextConfig);