/** @type {import('next').NextConfig} */

// CASA 10.3.2: Content Security Policy for code integrity protection
const ContentSecurityPolicy = [
  "default-src 'self'",
  // Scripts: self + Next.js inline scripts + Vercel Analytics
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com",
  // Styles: self + inline (required for Next.js CSS-in-JS)
  "style-src 'self' 'unsafe-inline'",
  // Images: self + YouTube thumbnails + data URIs (for inline images)
  "img-src 'self' data: blob: https://*.ytimg.com https://*.ggpht.com",
  // API connections: self + external services
  "connect-src 'self' https://api.stripe.com https://www.googleapis.com https://youtubeanalytics.googleapis.com https://oauth2.googleapis.com https://va.vercel-scripts.com",
  // Frames: Stripe checkout iframe
  "frame-src https://js.stripe.com https://checkout.stripe.com",
  // Fonts: self only
  "font-src 'self'",
  // Form actions: self only
  "form-action 'self'",
  // Frame ancestors: prevent clickjacking
  "frame-ancestors 'none'",
  // Base URI: prevent base tag hijacking
  "base-uri 'self'",
  // Object/embed: disabled
  "object-src 'none'",
].join("; ");

// Security headers applied to all routes
const securityHeaders = [
  // CASA 10.3.2: Content Security Policy
  { key: "Content-Security-Policy", value: ContentSecurityPolicy },
  // Prevent clickjacking
  { key: "X-Frame-Options", value: "DENY" },
  // Prevent MIME type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Enable XSS filter in older browsers
  { key: "X-XSS-Protection", value: "1; mode=block" },
  // Control referrer information
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Enforce HTTPS (let Vercel/hosting handle HSTS preload)
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  // Disable browser features we don't need
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self)" },
];

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // YouTube thumbnails + channel avatars (hosts can vary by region/CDN)
      { protocol: "https", hostname: "**.ytimg.com", pathname: "/**" },
      { protocol: "https", hostname: "**.ggpht.com", pathname: "/**" },
      // Replicate AI-generated images
      { protocol: "https", hostname: "replicate.delivery", pathname: "/**" },
    ],
  },
  experimental: {
    serverActions: { allowedOrigins: ["*"] },
    // Enable CSS optimization
    optimizeCss: true,
  },
  async headers() {
    return [
      // Apply security headers to all routes
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
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
      // Canonical domain redirect: non-www to www
      // Ensures all traffic uses the canonical www domain for SEO consistency
      {
        source: "/:path*",
        has: [{ type: "host", value: "getchannelboost.com" }],
        destination: "https://www.getchannelboost.com/:path*",
        permanent: true,
      },
      // Consolidated Learn article redirect
      {
        source: "/learn/how-to-increase-audience-retention",
        destination: "/learn/youtube-retention-analysis",
        permanent: true,
      },
      // Legacy route -> Subscriber Insights
      { source: "/converters", destination: "/subscriber-insights", permanent: true },
      { source: "/converters/:path*", destination: "/subscriber-insights", permanent: true },
    ];
  },
};
module.exports = nextConfig;