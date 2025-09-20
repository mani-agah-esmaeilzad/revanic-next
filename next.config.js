
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'picsum.photos', 
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'via.placeholder.com', 
                port: '',
                pathname: '/**',
            }
        ],
    },
};

module.exports = nextConfig;
