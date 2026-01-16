import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { BRAND } from "@/lib/brand";
import ContactClient from "./ContactClient";

export const metadata: Metadata = {
  title: `Contact | ${BRAND.name}`,
  description: `Get in touch with the ${BRAND.name} team. We're here to help with questions about YouTube growth, channel analytics, and our platform.`,
  alternates: { canonical: `${BRAND.url}/contact` },
  openGraph: {
    title: `Contact ${BRAND.name}`,
    description: `Get in touch with the ${BRAND.name} team for support and questions.`,
    url: `${BRAND.url}/contact`,
    type: "website",
  },
};

export default async function ContactPage() {
  // Get session to pre-fill email if signed in
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email ?? null;

  return <ContactClient userEmail={userEmail} />;
}
