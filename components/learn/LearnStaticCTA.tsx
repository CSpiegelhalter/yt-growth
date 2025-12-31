import Link from "next/link";

type Props = {
  title: string;
  description: string;
  buttonText?: string;
  buttonHref?: string;
};

/**
 * LearnStaticCTA - Server-rendered CTA for Learn pages
 * 
 * Eliminates CLS by rendering immediately without auth checks.
 * Always shows "Get Started" linking to signup (most visitors are not signed in).
 */
export function LearnStaticCTA({
  title,
  description,
  buttonText = "Get Started Free",
  buttonHref = "/auth/signup",
}: Props) {
  return (
    <section className="learnCta">
      <h2 className="learnCta__title">{title}</h2>
      <p className="learnCta__text">{description}</p>
      <Link href={buttonHref} className="learnCta__btn">
        {buttonText}
      </Link>
    </section>
  );
}

