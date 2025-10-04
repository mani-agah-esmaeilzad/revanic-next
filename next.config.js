// next.config.js
const runtimeCaching = [
    {
        urlPattern: /^https?:\/\/res\.cloudinary\.com\/.*$/,
        handler: "CacheFirst",
        options: {
            cacheName: "revanic-images",
            expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
            cacheableResponse: { statuses: [0, 200] },
        },
    },
    {
        urlPattern: /^https?:\/\/fonts\.gstatic\.com\/.*$/,
        handler: "CacheFirst",
        options: {
            cacheName: "revanic-fonts",
            expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
        },
    },
    {
        urlPattern: ({ request }) => request.destination === "document" || request.destination === "script",
        handler: "NetworkFirst",
        options: {
            cacheName: "revanic-pages",
            networkTimeoutSeconds: 10,
            expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
        },
    },
    {
        urlPattern: ({ url }) => url.pathname.startsWith("/api"),
        handler: "NetworkFirst",
        options: {
            cacheName: "revanic-api",
            networkTimeoutSeconds: 10,
            expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 },
        },
    },
];

const withPWA = require("next-pwa")({
    dest: "public",
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === "development",
    runtimeCaching,
    fallbacks: {
        document: "/offline",
    },
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