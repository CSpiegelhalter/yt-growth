/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // YouTube thumbnails + channel avatars (hosts can vary by region/CDN)
      { protocol: "https", hostname: "**.ytimg.com", pathname: "/**" },
      { protocol: "https", hostname: "**.ggpht.com", pathname: "/**" },
    ],
  },
  experimental: { serverActions: { allowedOrigins: ["*"] } },
  async redirects() {
    return [
      // Legacy route -> Subscriber Insights
      { source: "/converters", destination: "/subscriber-insights", permanent: true },
      { source: "/converters/:path*", destination: "/subscriber-insights", permanent: true },
    ];
  },
};
module.exports = nextConfig;