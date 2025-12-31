import { Suspense } from "react";
import { Inter } from "next/font/google";
import { HeaderWrapper } from "@/components/HeaderWrapper";
import { HeaderStatic } from "@/components/HeaderStatic";
import { Footer } from "@/components/Footer";
import { Providers } from "@/components/Providers";
import { BRAND, STRUCTURED_DATA } from "@/lib/brand";
import "@/app/globals.css";
import type { Metadata, Viewport } from "next";

/**
 * next/font ensures fonts are self-hosted and preloaded,
 * eliminating font swap CLS. Using `display: swap` with
 * size-adjust for minimal layout shift.
 */
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  // Fallback metrics help reduce CLS during font load
  fallback: [
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "Helvetica Neue",
    "Arial",
    "sans-serif",
  ],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export const metadata: Metadata = {
  title: {
    default: `${BRAND.name} | ${BRAND.tagline}`,
    template: `%s | ${BRAND.name}`,
  },
  description: BRAND.description,
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || `https://${BRAND.domain}`
  ),
  keywords: [
    "youtube growth tool",
    "youtube analytics",
    "youtube channel audit",
    "youtube retention analysis",
    "youtube competitor analysis",
    "video ideas generator",
    "get more subscribers",
    "youtube creator tools",
  ],
  authors: [{ name: BRAND.name }],
  creator: BRAND.name,
  publisher: BRAND.name,
  openGraph: {
    type: "website",
    locale: "en_US",
    url: BRAND.url,
    siteName: BRAND.name,
    title: `${BRAND.name} | ${BRAND.tagline}`,
    description: BRAND.shortDescription,
    images: [
      {
        url: "/og/channelboost.svg",
        width: 1200,
        height: 630,
        alt: `${BRAND.name} - ${BRAND.tagline}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND.name} | ${BRAND.tagline}`,
    description: BRAND.shortDescription,
    site: BRAND.twitterHandle,
    creator: BRAND.twitterHandle,
    images: ["/og/channelboost.svg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon.svg", type: "image/svg+xml", sizes: "any" },
    ],
    apple: "/apple-touch-icon.svg",
  },
  manifest: "/manifest.json",
  alternates: {
    canonical: BRAND.url,
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.svg" />
        <meta name="theme-color" content={BRAND.themeColor} />
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(STRUCTURED_DATA.organization),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(STRUCTURED_DATA.website),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(STRUCTURED_DATA.softwareApplication),
          }}
        />
      </head>
      <body>
        <Providers>
          <div className="appShell">
            <Suspense fallback={<HeaderStatic />}>
              <HeaderWrapper />
            </Suspense>
            <div className="appMain">{children}</div>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
