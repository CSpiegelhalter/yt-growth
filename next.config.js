/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com", pathname: "/**" },
      { protocol: "https", hostname: "yt3.ggpht.com", pathname: "/**" },
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