import type { Metadata } from "next";
import { BRAND } from "@/lib/brand";
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
        <p className={s.updated}>Last updated: December 2024</p>

        <section className={s.section}>
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using {BRAND.name}, you agree to be bound by these Terms of Service. 
            If you do not agree to these terms, please do not use our service.
          </p>
        </section>

        <section className={s.section}>
          <h2>2. Description of Service</h2>
          <p>
            {BRAND.name} provides YouTube channel analytics, video insights, competitor analysis, 
            and AI-powered content ideation tools to help creators grow their channels.
          </p>
        </section>

        <section className={s.section}>
          <h2>3. Account Registration</h2>
          <p>
            To use certain features, you must create an account and connect your YouTube channel. 
            You are responsible for maintaining the confidentiality of your account and for all 
            activities that occur under your account.
          </p>
        </section>

        <section className={s.section}>
          <h2>4. YouTube API Services</h2>
          <p>
            Our service uses YouTube API Services. By using {BRAND.name}, you agree to be bound by the{" "}
            <a 
              href="https://www.youtube.com/t/terms" 
              target="_blank" 
              rel="noopener noreferrer"
              className={s.link}
            >
              YouTube Terms of Service
            </a>. 
            You can revoke our access to your YouTube data at any time via{" "}
            <a 
              href="https://security.google.com/settings/security/permissions" 
              target="_blank" 
              rel="noopener noreferrer"
              className={s.link}
            >
              Google Security Settings
            </a>.
          </p>
        </section>

        <section className={s.section}>
          <h2>5. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use the service for any unlawful purpose</li>
            <li>Attempt to gain unauthorized access to our systems</li>
            <li>Interfere with or disrupt the service</li>
            <li>Resell or redistribute our service without permission</li>
            <li>Use automated systems to access the service excessively</li>
          </ul>
        </section>

        <section className={s.section}>
          <h2>6. Intellectual Property</h2>
          <p>
            The service and its original content, features, and functionality are owned by 
            {BRAND.name} and are protected by international copyright, trademark, and other 
            intellectual property laws.
          </p>
        </section>

        <section className={s.section}>
          <h2>7. Disclaimer</h2>
          <p>
            The service is provided &ldquo;as is&rdquo; without warranties of any kind. We do not 
            guarantee that our insights or recommendations will result in channel growth or 
            increased revenue.
          </p>
        </section>

        <section className={s.section}>
          <h2>8. Limitation of Liability</h2>
          <p>
            {BRAND.name} shall not be liable for any indirect, incidental, special, consequential, 
            or punitive damages resulting from your use of or inability to use the service.
          </p>
        </section>

        <section className={s.section}>
          <h2>9. Changes to Terms</h2>
          <p>
            We reserve the right to modify these terms at any time. We will notify users of 
            significant changes via email or through the service.
          </p>
        </section>

        <section className={s.section}>
          <h2>10. Contact</h2>
          <p>
            Questions about these Terms? Please{" "}
            <a href="/contact" className={s.link}>contact us</a>.
          </p>
        </section>
      </div>
    </main>
  );
}
