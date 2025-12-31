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
  experimental: {
    serverActions: { allowedOrigins: ["*"] },
    // Enable CSS optimization
    optimizeCss: true,
  },
  async headers() {
    return [
      // Allow indexing on all public pages - split into separate rules for reliable matching
      {
        source: "/",
        headers: [{ key: "X-Robots-Tag", value: "index, follow" }],
      },
      {
        source: "/learn",
        headers: [{ key: "X-Robots-Tag", value: "index, follow" }],
      },
      {
        source: "/learn/:slug",
        headers: [{ key: "X-Robots-Tag", value: "index, follow" }],
      },
      {
        source: "/contact",
        headers: [{ key: "X-Robots-Tag", value: "index, follow" }],
      },
      {
        source: "/terms",
        headers: [{ key: "X-Robots-Tag", value: "index, follow" }],
      },
      {
        source: "/privacy",
        headers: [{ key: "X-Robots-Tag", value: "index, follow" }],
      },
      {
        source: "/auth/:path*",
        headers: [{ key: "X-Robots-Tag", value: "index, follow" }],
      },
    ];
  },
  async redirects() {
    return [
      // Legacy route -> Subscriber Insights
      { source: "/converters", destination: "/subscriber-insights", permanent: true },
      { source: "/converters/:path*", destination: "/subscriber-insights", permanent: true },
    ];
  },
};
module.exports = nextConfig;