import type { Metadata } from "next";
import { Suspense } from "react";
import SignupForm from "./SignupForm";
import { BRAND } from "@/lib/shared/brand";

export const metadata: Metadata = {
  title: `Create Account | ${BRAND.name}`,
  description: `Create your ${BRAND.name} account to start growing your YouTube channel with data-driven insights.`,
  robots: { index: false, follow: false },
};

/**
 * SignupPage - Server component wrapper for SEO metadata
 */
export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  );
}
