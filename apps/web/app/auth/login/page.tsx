import type { Metadata } from "next";
import { Suspense } from "react";

import { BRAND } from "@/lib/shared/brand";

import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: `Sign In | ${BRAND.name}`,
  description: `Sign in to your ${BRAND.name} account to access your YouTube growth dashboard.`,
  robots: { index: false, follow: false },
};

/**
 * LoginPage - Server component wrapper for SEO metadata
 */
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
