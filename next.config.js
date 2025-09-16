/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'picsum.photos', // <-- هاست مورد نظر اضافه شد
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'via.placeholder.com', // این را هم برای آینده اضافه می‌کنیم
                port: '',
                pathname: '/**',
            }
        ],
    },
};

module.exports = nextConfig;
