/**
 * Server component that renders the article hero section.
 * Must remain a server component - no "use client" directive.
 */

import Link from "next/link";
import { ArticleMeta } from "@/components/learn";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface LearnHeroProps {
  breadcrumb: BreadcrumbItem[];
  title: string;
  subtitle: string;
  readingTime: string;
  styles: {
    hero: string;
    breadcrumb: string;
    title: string;
    subtitle: string;
  };
  /** Optional children to render after ArticleMeta (e.g., Quick Summary box) */
  children?: React.ReactNode;
}

export function LearnHero({
  breadcrumb,
  title,
  subtitle,
  readingTime,
  styles: s,
  children,
}: LearnHeroProps) {
  return (
    <header className={s.hero}>
      <nav className={s.breadcrumb} aria-label="Breadcrumb">
        {breadcrumb.map((item, index) => (
          <span key={index}>
            {index > 0 && " / "}
            {item.href ? <Link href={item.href}>{item.label}</Link> : item.label}
          </span>
        ))}
      </nav>
      <h1 className={s.title}>{title}</h1>
      <p className={s.subtitle}>{subtitle}</p>
      <ArticleMeta readingTime={readingTime} />
      {children}
    </header>
  );
}
