import type { Metadata } from "next";
import { BRAND } from "@/lib/brand";
import s from "./style.module.css";

export const metadata: Metadata = {
  title: `Privacy Policy | ${BRAND.name}`,
  description: `Privacy Policy for ${BRAND.name} - How we handle your data and protect your privacy.`,
  alternates: { canonical: `${BRAND.url}/privacy` },
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <main className={s.container}>
      <div className={s.content}>
        <h1 className={s.title}>Privacy Policy</h1>
        <p className={s.updated}>Last updated: December 30, 2024</p>

        <section className={s.section}>
          <h2>1. Information We Collect</h2>
          <p>
            When you use {BRAND.name}, we collect information you provide
            directly to us, including:
          </p>
          <ul>
            <li>Account information (email address, name)</li>
            <li>
              YouTube channel data you authorize us to access (see Section 3 for
              details)
            </li>
            <li>Usage data and preferences within our platform</li>
          </ul>
        </section>

        <section className={s.section}>
          <h2>2. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Provide, maintain, and improve our services</li>
            <li>Analyze your YouTube channel performance</li>
            <li>Generate personalized video ideas and insights</li>
            <li>Send you technical notices and support messages</li>
          </ul>
        </section>

        <section className={s.section}>
          <h2>3. Google API Services & YouTube Data</h2>
          <p>
            {BRAND.name} uses YouTube API Services. By using our service, you
            are also agreeing to be bound by the{" "}
            <a
              href="https://www.youtube.com/t/terms"
              target="_blank"
              rel="noopener noreferrer"
              className={s.link}
            >
              YouTube Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className={s.link}
            >
              Google Privacy Policy
            </a>
            .
          </p>

          <h3>3.1 What YouTube Data We Access</h3>
          <p>When you connect your YouTube account, we request access to:</p>
          <ul>
            <li>
              <strong>YouTube channel information</strong> – Your channel ID,
              name, and associated playlists (read-only)
            </li>
            <li>
              <strong>Video metadata</strong> – Titles, descriptions, tags,
              thumbnails, and publish dates for your videos (read-only)
            </li>
            <li>
              <strong>YouTube Analytics</strong> – Views, watch time, retention
              data, subscriber counts, and engagement metrics for your channel
              and videos (read-only)
            </li>
            <li>
              <strong>Comments data</strong> – Access to comments on your videos
              for analysis purposes (read-only via secure endpoint)
            </li>
          </ul>

          <h3>3.2 How We Use YouTube Data</h3>
          <p>We use the YouTube data we access solely to:</p>
          <ul>
            <li>
              Display your channel and video analytics within the {BRAND.name}{" "}
              dashboard
            </li>
            <li>
              Analyze retention patterns and identify drop-off points in your
              videos
            </li>
            <li>Identify which videos are driving subscriber growth</li>
            <li>
              Generate AI-powered video ideas and content recommendations based
              on your performance data
            </li>
            <li>
              Compare your channel metrics to help you understand your content
              performance
            </li>
          </ul>

          <h3>3.3 How We Store YouTube Data</h3>
          <p>
            Your YouTube data is stored securely in our database with the
            following protections:
          </p>
          <ul>
            <li>OAuth refresh tokens are encrypted at rest</li>
            <li>All data is transmitted over HTTPS/TLS encryption</li>
            <li>Access to data is restricted to authenticated users only</li>
            <li>
              We store video metadata and analytics snapshots to provide
              historical insights and reduce API calls
            </li>
          </ul>

          <h3>3.4 Data Sharing</h3>
          <p>
            <strong>
              We do not sell, rent, or share your YouTube data with third
              parties
            </strong>{" "}
            except in the following limited circumstances:
          </p>
          <ul>
            <li>With your explicit consent</li>
            <li>
              To comply with legal obligations or respond to lawful requests
              from public authorities
            </li>
            <li>
              To protect the rights, property, or safety of {BRAND.name}, our
              users, or the public
            </li>
          </ul>

          <h3>3.5 Google Limited Use Disclosure</h3>
          <p>
            {BRAND.name}'s use and transfer to any other app of information
            received from Google APIs will adhere to{" "}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy#additional_requirements_for_specific_api_scopes"
              target="_blank"
              rel="noopener noreferrer"
              className={s.link}
            >
              Google API Services User Data Policy
            </a>
            , including the Limited Use requirements.
          </p>
        </section>

        <section className={s.section}>
          <h2>4. Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to
            protect your personal information against unauthorized access,
            alteration, disclosure, or destruction. These measures include:
          </p>
          <ul>
            <li>Encryption of sensitive data at rest and in transit</li>
            <li>Regular security assessments and monitoring</li>
            <li>Access controls and authentication requirements</li>
            <li>
              Secure cloud infrastructure with industry-standard protections
            </li>
          </ul>
        </section>

        <section className={s.section}>
          <h2>5. Data Retention</h2>
          <p>
            We retain your information for as long as your account is active or
            as needed to provide you services. Specifically:
          </p>
          <ul>
            <li>
              <strong>Account data</strong> – Retained until you delete your
              account or request deletion
            </li>
            <li>
              <strong>YouTube analytics data</strong> – Retained while your
              account is active to provide historical insights
            </li>
            <li>
              <strong>OAuth tokens</strong> – Retained until you revoke access
              or disconnect your YouTube account
            </li>
          </ul>
          <p>
            You can request deletion of your data at any time by contacting us
            or by deleting your account from your profile settings.
          </p>
        </section>

        <section className={s.section}>
          <h2>6. Your Rights & Revoking Access</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access the personal data we hold about you</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Export your data</li>
            <li>Revoke YouTube API access at any time</li>
          </ul>

          <h3>How to Revoke YouTube Access</h3>
          <p>
            You can revoke {BRAND.name}'s access to your YouTube data at any
            time by:
          </p>
          <ol>
            <li>
              Going to your{" "}
              <a
                href="https://myaccount.google.com/permissions"
                target="_blank"
                rel="noopener noreferrer"
                className={s.link}
              >
                Google Account Security Settings
              </a>
            </li>
            <li>
              Finding "{BRAND.name}" in the list of third-party apps with access
            </li>
            <li>Clicking "Remove Access"</li>
          </ol>
          <p>
            Upon revocation, we will no longer be able to access your YouTube
            data, though previously stored analytics snapshots will remain in
            your account until you request deletion.
          </p>
        </section>

        <section className={s.section}>
          <h2>7. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify
            you of any material changes by posting the new Privacy Policy on
            this page and updating the "Last updated" date. We encourage you to
            review this Privacy Policy periodically for any changes.
          </p>
        </section>

        <section className={s.section}>
          <h2>8. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, how we handle
            your data, or wish to exercise any of your data rights, please{" "}
            <a href="/contact" className={s.link}>
              contact us
            </a>.
          </p>
        </section>
      </div>
    </main>
  );
}
