import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { BRAND } from "@/lib/brand";
import { CONTACT_CONTENT } from "@/lib/content/contact";
import ContactForm from "./ContactForm";
import s from "./style.module.css";

export const metadata: Metadata = {
  title: `Contact Us | ${BRAND.name} Support`,
  description: `Get in touch with the ${BRAND.name} team. We help with technical support, billing questions, feature requests, and YouTube growth strategies. Response within 24-48 hours.`,
  alternates: { canonical: `${BRAND.url}/contact` },
  openGraph: {
    title: `Contact ${BRAND.name} - Get Help`,
    description: `Have questions about YouTube growth or need help with ${BRAND.name}? Contact our support team for personalized assistance.`,
    url: `${BRAND.url}/contact`,
    type: "website",
  },
};

export default async function ContactPage() {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email ?? null;
  const content = CONTACT_CONTENT;

  return (
    <main className={s.page}>
      <div className={s.pageInner}>
        {/* Page Header */}
        <header className={s.pageHeader}>
          <h1 className={s.pageTitle}>{content.hero.title}</h1>
          <p className={s.pageSubtitle}>{content.hero.subtitle}</p>
        </header>

        {/* Intro Text */}
        <p className={s.intro}>{content.intro}</p>

        {/* Two Column Content: What We Help With + Before You Contact */}
        <div className={s.twoCol}>
          {/* What We Help With */}
          <section className={s.contentSection}>
            <h2 className={s.sectionTitle}>{content.sections.whatWeHelp.title}</h2>
            <ul className={s.helpList}>
              {content.sections.whatWeHelp.items.map((item) => (
                <li key={item.label} className={s.helpItem}>
                  <div className={s.helpLabel}>{item.label}</div>
                  <p className={s.helpDesc}>{item.description}</p>
                </li>
              ))}
            </ul>
          </section>

          {/* Before You Contact */}
          <section className={s.contentSection}>
            <h2 className={s.sectionTitle}>{content.sections.beforeContact.title}</h2>
            <p className={s.sectionDesc}>{content.sections.beforeContact.description}</p>
            <ul className={s.linksList}>
              {content.sections.beforeContact.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={s.linkItem}>
                    {link.label} →
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* What to Expect */}
        <section className={s.contentSection} style={{ marginBottom: "var(--space-xl)" }}>
          <h2 className={s.sectionTitle}>{content.sections.expectations.title}</h2>
          <ul className={s.expectList}>
            {content.sections.expectations.items.map((item, idx) => (
              <li key={idx} className={s.expectItem}>
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* Contact Form */}
        <section className={s.formSection}>
          <h2 className={s.formSectionTitle}>Send Us a Message</h2>
          <ContactForm userEmail={userEmail} />
        </section>

        {/* Direct Email */}
        <p className={s.directEmail}>
          {content.directEmail.intro}{" "}
          <a href={`mailto:${content.directEmail.email}`} className={s.emailLink}>
            {content.directEmail.email}
          </a>
        </p>

        {/* FAQ Section */}
        <section className={s.faqSection}>
          <h2 className={s.faqTitle}>{content.faq.title}</h2>
          <div className={s.faqList}>
            {content.faq.items.map((faq, idx) => (
              <details key={idx} className={s.faqItem}>
                <summary className={s.faqQuestion}>{faq.question}</summary>
                <p className={s.faqAnswer}>{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Product Blurb */}
        <section className={s.productSection}>
          <h2 className={s.productTitle}>{content.productBlurb.title}</h2>
          <p className={s.productDesc}>{content.productBlurb.description}</p>
          <Link href={content.productBlurb.cta.href} className={s.productLink}>
            {content.productBlurb.cta.label} →
          </Link>
        </section>

        {/* Footer Link */}
        <div className={s.footerLinks}>
          <Link href="/dashboard" className={s.footerLink}>
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
