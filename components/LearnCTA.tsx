import Link from "next/link";
import s from "./LearnCTA.module.css";

type Props = {
  title: string;
  description: string;
  className?: string;
};

/**
 * LearnCTA - CTA for Learn pages
 * Links to dashboard which handles auth redirect if needed
 */
export function LearnCTA({ title, description, className }: Props) {
  return (
    <section className={`${s.cta} ${className ?? ""}`.trim()}>
      <h2 className={s.title}>{title}</h2>
      <p className={s.text}>{description}</p>
      <Link href="/dashboard" className={s.btn}>
        Get Started
      </Link>
    </section>
  );
}

