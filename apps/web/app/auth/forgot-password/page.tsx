import type { Metadata } from "next";
import { Suspense } from "react";
import ForgotPasswordForm from "./ForgotPasswordForm";
import { BRAND } from "@/lib/brand";

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
