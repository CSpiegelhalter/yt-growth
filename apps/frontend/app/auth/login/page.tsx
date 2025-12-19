import type { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign In | YT Growth",
  description: "Sign in to your YT Growth account",
};

/**
 * LoginPage - Server component wrapper for SEO metadata
 */
export default function LoginPage() {
  return <LoginForm />;
}
