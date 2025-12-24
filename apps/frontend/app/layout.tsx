import { Suspense } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Providers } from "@/components/Providers";
import { BRAND, STRUCTURED_DATA } from "@/lib/brand";
import "@/app/globals.css";
import type { Metadata } from "next";

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
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
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
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
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
            __html: JSON.stringify(STRUCTURED_DATA.softwareApplication),
          }}
        />
      </head>
      <body>
        <Providers>
          <div
            className="container"
            style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
          >
            <Suspense fallback={null}>
              <Header />
            </Suspense>
            <main style={{ flex: 1 }}>{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
