import type { Metadata } from "next";
import { BRAND } from "@/lib/shared/brand";
import s from "./style.module.css";

export const metadata: Metadata = {
  title: `Terms of Service | ${BRAND.name}`,
  description: `Terms of Service for ${BRAND.name} - YouTube growth analytics platform for creators.`,
  alternates: { canonical: `${BRAND.url}/terms` },
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <main className={s.container}>
      <div className={s.content}>
        <h1 className={s.title}>Terms of Service</h1>
        <p className={s.updated}>Last updated: January 5, 2026</p>

        <section className={s.section}>
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using {BRAND.name}, you agree to be bound by these
            Terms of Service (the “Terms”). If you do not agree, do not use the
            service.
          </p>
        </section>

        <section className={s.section}>
          <h2>2. Description of Service</h2>
          <p>
            {BRAND.name} is a YouTube analytics and insights platform that helps
            creators understand performance trends, analyze content, and
            generate recommendations and ideas. Some features may be powered by
            third-party AI services to produce user-facing summaries and
            insights.
          </p>
          <p>
            You understand that analytics and recommendations are informational
            only and may not lead to any particular outcome (such as growth,
            revenue, or engagement).
          </p>
        </section>

        <section className={s.section}>
          <h2>3. Eligibility and Account Registration</h2>
          <p>
            To use certain features, you must create an account and connect a
            YouTube channel through Google’s OAuth flow. You are responsible for
            maintaining the confidentiality of your account, and you are
            responsible for all activity that occurs under your account.
          </p>
          <p>
            You agree to provide accurate information and to keep your account
            information up to date. You must promptly notify us of any
            unauthorized use of your account.
          </p>
        </section>

        <section className={s.section}>
          <h2>4. YouTube API Services and Read-Only Access</h2>
          <p>
            {BRAND.name} uses YouTube API Services. By using {BRAND.name}, you
            agree to be bound by the{" "}
            <a
              href="https://www.youtube.com/t/terms"
              target="_blank"
              rel="noopener noreferrer"
              className={s.link}
            >
              YouTube Terms of Service
            </a>
            .
          </p>

          <p>
            Our access to your YouTube data is <strong>read-only</strong>. We do
            not upload videos, delete content, modify video metadata, post
            comments, or change channel settings.
          </p>

          <p>
            You can revoke our access to your YouTube data at any time via{" "}
            <a
              href="https://myaccount.google.com/permissions"
              target="_blank"
              rel="noopener noreferrer"
              className={s.link}
            >
              your Google Account permissions page
            </a>
            . If you revoke access, the service may stop working until you
            reconnect.
          </p>
        </section>

        <section className={s.section}>
          <h2>5. Third-Party Services and AI Features</h2>
          <p>
            Certain features may use third-party services (including AI
            providers) to generate user-facing outputs such as summaries,
            recommendations, and comment analysis.
          </p>
          <ul>
            <li>
              You authorize us to transmit the minimum data necessary to provide
              the feature you are actively using (for example, selected video
              metadata, selected analytics metrics, and/or selected comment text
              when you run comment analysis).
            </li>
            <li>
              You agree not to submit content that you do not have the right to
              use, or content that violates laws or third-party rights.
            </li>
            <li>
              You understand that AI-generated outputs may be inaccurate,
              incomplete, or inappropriate and should be reviewed by you before
              acting on them.
            </li>
          </ul>
        </section>

        <section className={s.section}>
          <h2>6. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use the service for any unlawful purpose</li>
            <li>
              Attempt to gain unauthorized access to accounts, systems, or
              networks
            </li>
            <li>Interfere with or disrupt the service or bypass rate limits</li>
            <li>
              Reverse engineer, decompile, or attempt to extract source code
              (except where legally prohibited)
            </li>
            <li>
              Resell, sublicense, or redistribute the service without our
              written permission
            </li>
            <li>
              Use automated systems to access the service in a way that is
              excessive or abusive
            </li>
          </ul>
        </section>

        <section className={s.section}>
          <h2>7. User Content</h2>
          <p>
            “User Content” includes information you submit to the service and
            any YouTube data you authorize us to access via the YouTube APIs.
            You retain ownership of your User Content.
          </p>
          <p>
            You grant {BRAND.name} a limited, non-exclusive license to process
            your User Content solely to operate, maintain, and provide the
            service to you (including generating user-facing outputs you
            request).
          </p>
        </section>

        <section className={s.section}>
          <h2>8. Subscriptions, Billing, and Refunds</h2>
          <p>
            If we offer paid plans, prices, features, and billing terms will be
            displayed in the app at the time you subscribe. Unless otherwise
            stated, payments are non-refundable, and you may cancel at any time
            to stop future renewals.
          </p>
          <p>
            We may change pricing or plan features from time to time. If changes
            affect you, we will provide reasonable notice through the service or
            by email.
          </p>
        </section>

        <section className={s.section}>
          <h2>9. Intellectual Property</h2>
          <p>
            The service, including its design, text, graphics, logos, and
            functionality, is owned by {BRAND.name} and is protected by
            intellectual property laws. You may not copy, modify, distribute,
            sell, or lease any part of our service unless you have our written
            permission.
          </p>
        </section>

        <section className={s.section}>
          <h2>10. Disclaimers</h2>
          <p>
            THE SERVICE IS PROVIDED “AS IS” AND “AS AVAILABLE” WITHOUT
            WARRANTIES OF ANY KIND. WE DO NOT WARRANT THAT THE SERVICE WILL BE
            UNINTERRUPTED, ERROR-FREE, OR SECURE.
          </p>
          <p>
            We do not guarantee that insights, recommendations, or AI-generated
            outputs will lead to channel growth, increased revenue, higher
            engagement, or any particular result.
          </p>
        </section>

        <section className={s.section}>
          <h2>11. Limitation of Liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, {BRAND.name} SHALL NOT BE
            LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR
            PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, REVENUE, DATA, OR
            GOODWILL, ARISING FROM OR RELATED TO YOUR USE OF (OR INABILITY TO
            USE) THE SERVICE.
          </p>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, OUR TOTAL LIABILITY FOR ANY
            CLAIM ARISING OUT OF OR RELATED TO THE SERVICE WILL NOT EXCEED THE
            AMOUNT YOU PAID TO USE THE SERVICE IN THE TWELVE (12) MONTHS BEFORE
            THE EVENT GIVING RISE TO THE CLAIM, OR $100 IF YOU HAVE NOT PAID ANY
            AMOUNTS.
          </p>
        </section>

        <section className={s.section}>
          <h2>12. Termination</h2>
          <p>
            You may stop using the service at any time. We may suspend or
            terminate access to the service if we reasonably believe you have
            violated these Terms, used the service in an abusive manner, or
            created risk for us or others.
          </p>
          <p>
            Upon termination, your right to use the service ends. Sections that
            by their nature should survive termination will survive (including
            disclaimers and limitation of liability).
          </p>
        </section>

        <section className={s.section}>
          <h2>13. Changes to These Terms</h2>
          <p>
            We may update these Terms from time to time. If we make material
            changes, we will provide notice through the service or by email, and
            we will update the “Last updated” date above. Your continued use of
            the service after changes become effective constitutes acceptance of
            the updated Terms.
          </p>
        </section>

        <section className={s.section}>
          <h2>14. Contact</h2>
          <p>
            Questions about these Terms? Please{" "}
            <a href="/contact" className={s.link}>
              contact us
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}