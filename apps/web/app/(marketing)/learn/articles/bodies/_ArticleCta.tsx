/**
 * Shared CTA block for learn article bodies.
 * Renders a styled call-to-action with heading, description, and link.
 */

import Link from "next/link";
import { BRAND } from "@/lib/shared/brand";

const ctaHeadingStyle: React.CSSProperties = {
  fontSize: "1.5rem",
  fontWeight: 700,
  marginBottom: "1rem",
};

const ctaTextStyle: React.CSSProperties = {
  fontSize: "1.125rem",
  marginBottom: "1.5rem",
  maxWidth: "500px",
  marginLeft: "auto",
  marginRight: "auto",
};

const ctaLinkStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "0.875rem 2rem",
  background: "white",
  color: "#6366f1",
  fontWeight: 600,
  borderRadius: "0.5rem",
  textDecoration: "none",
};

interface ArticleCtaProps {
  heading: string;
  description: string;
  linkText?: string;
  linkHref?: string;
  children?: React.ReactNode;
}

export function ArticleCta({
  heading,
  description,
  linkText,
  linkHref = "/dashboard",
  children,
}: ArticleCtaProps) {
  return (
    <div className="sectionAccent">
      <h3 style={ctaHeadingStyle}>{heading}</h3>
      <p style={ctaTextStyle}>{description}</p>
      <Link href={linkHref} style={ctaLinkStyle}>
        {linkText ?? `Try ${BRAND.name} Free`}
      </Link>
      {children}
    </div>
  );
}
