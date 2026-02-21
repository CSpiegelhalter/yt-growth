import type { Metadata } from "next";
import { Suspense } from "react";
import ResetPasswordForm from "./ResetPasswordForm";
import { BRAND } from "@/lib/shared/brand";

export const metadata: Metadata = {
  title: `Reset Password | ${BRAND.name}`,
  description: `Set a new password for your ${BRAND.name} account.`,
  robots: { index: false, follow: false },
};

/**
 * ResetPasswordPage - Server component wrapper for SEO metadata
 */
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
