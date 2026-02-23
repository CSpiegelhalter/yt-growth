import type { Metadata } from "next";
import { Suspense } from "react";

import { BRAND } from "@/lib/shared/brand";

import ForgotPasswordForm from "./ForgotPasswordForm";

export const metadata: Metadata = {
  title: `Forgot Password | ${BRAND.name}`,
  description: `Reset your ${BRAND.name} account password.`,
  robots: { index: false, follow: false },
};

/**
 * ForgotPasswordPage - Server component wrapper for SEO metadata
 */
export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
