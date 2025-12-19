import type { Metadata } from "next";
import SignupForm from "./SignupForm";

export const metadata: Metadata = {
  title: "Create Account | YT Growth",
  description: "Create your YT Growth account to start growing your channel",
};

/**
 * SignupPage - Server component wrapper for SEO metadata
 */
export default function SignupPage() {
  return <SignupForm />;
}
