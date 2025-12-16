import { Header } from "@/components/Header";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import "@/app/globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "YouTube Growth Consultant",
    template: "%s | YouTube Growth Consultant",
  },
  description:
    "AI-powered YouTube growth tools. Get personalized video plans, retention analysis, and subscriber insights to grow your channel faster.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "YouTube Growth Consultant",
    title: "YouTube Growth Consultant",
    description:
      "AI-powered YouTube growth tools. Get personalized video plans, retention analysis, and subscriber insights.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "YouTube Growth Consultant",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "YouTube Growth Consultant",
    description:
      "AI-powered YouTube growth tools. Get personalized video plans, retention analysis, and subscriber insights.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#2563eb" />
      </head>
      <body>
        <div className="container">
          <Header session={session} />
          {children}
        </div>
      </body>
    </html>
  );
}
