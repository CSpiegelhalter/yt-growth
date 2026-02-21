import type { Metadata } from "next";
import { BRAND } from "@/lib/shared/brand";
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
        <p className={s.updated}>Last updated: January 5, 2026</p>

        <section className={s.section}>
          <h2>Quick Summary</h2>
          <ul>
            <li>
              {BRAND.name} helps you understand your YouTube channel performance
              and generate user-facing insights and recommendations.
            </li>
            <li>
              We use Google/YouTube APIs with your permission and access your
              data <strong>read-only</strong>.
            </li>
            <li>
              We may use a third-party AI service to generate insights. We send
              only the minimum data needed for the feature you request.
            </li>
            <li>
              We do not sell your data and do not use Google/YouTube user data
              for advertising.
            </li>
          </ul>
        </section>

        <section className={s.section}>
          <h2>1. Information We Collect</h2>
          <p>When you use {BRAND.name}, we collect:</p>
          <ul>
            <li>
              <strong>Account information</strong> (e.g., email address, name),
              provided by you or your sign-in provider.
            </li>
            <li>
              <strong>OAuth tokens</strong> (access/refresh tokens) needed to
              connect to YouTube API Services on your behalf.
            </li>
            <li>
              <strong>YouTube data you authorize us to access</strong> (details
              in Section 3).
            </li>
            <li>
              <strong>App usage and preferences</strong> (e.g., feature usage,
              settings, saved preferences).
            </li>
            <li>
              <strong>Security/diagnostic data</strong> (e.g., logs related to
              abuse prevention, debugging, and reliability).
            </li>
          </ul>
          <p>
            We do <strong>not</strong> collect your Google password.
            Authentication happens via Google’s OAuth flow.
          </p>
        </section>

        <section className={s.section}>
          <h2>2. How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul>
            <li>Provide, maintain, and improve {BRAND.name}</li>
            <li>Display your channel and video analytics in your dashboard</li>
            <li>
              Generate user-facing insights and recommendations you request (for
              example: summaries, performance diagnostics, video ideas)
            </li>
            <li>Provide customer support and respond to requests</li>
            <li>Protect the security and integrity of our service</li>
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

          <h3>3.1 Read-Only Access</h3>
          <p>
            Our access to YouTube data is <strong>read-only</strong>. We do not:
          </p>
          <ul>
            <li>Upload videos</li>
            <li>Edit video details</li>
            <li>Delete videos</li>
            <li>Post or delete comments</li>
            <li>Manage your channel settings</li>
          </ul>

          <h3>3.2 What YouTube Data We Access</h3>
          <p>When you connect your YouTube account, we may access:</p>
          <ul>
            <li>
              <strong>Channel information</strong> – Channel ID, name, and
              related read-only identifiers
            </li>
            <li>
              <strong>Video metadata</strong> – Titles, descriptions, tags,
              thumbnails, and publish dates (read-only)
            </li>
            <li>
              <strong>YouTube Analytics</strong> – Views, watch time, retention,
              subscriber counts, and engagement metrics for your channel/videos
              (read-only)
            </li>
            <li>
              <strong>Comments</strong> – Comments text on your videos for
              analysis features you request (read-only)
            </li>
          </ul>

          <h3>3.3 How We Use YouTube Data</h3>
          <p>
            We use YouTube data only to provide user-facing features, such as:
          </p>
          <ul>
            <li>Showing your analytics in the {BRAND.name} dashboard</li>
            <li>
              Identifying patterns (e.g., retention drop-offs, high performers)
            </li>
            <li>
              Generating recommendations and ideas based on your performance
              data
            </li>
            <li>Helping you compare performance across your own content</li>
          </ul>

          <h3>3.4 How We Store YouTube Data</h3>
          <p>We follow a data-minimization approach. In general:</p>
          <ul>
            <li>
              <strong>OAuth tokens</strong> are encrypted at rest and used only
              to access YouTube API data on your behalf.
            </li>
            <li>
              <strong>Raw YouTube API responses</strong> (e.g., video details,
              analytics responses, comment text) may be cached to improve
              performance and reduce API calls. Our standard cache window is
              approximately <strong>12 hours</strong> before refresh.
            </li>
            <li>
              We may store <strong>derived outputs</strong> you see in the app
              (for example: your generated insights, recommendations, or summary
              artifacts) so you can view them again, unless you delete them.
            </li>
          </ul>

          <h3>3.5 Data Sharing</h3>
          <p>
            <strong>We do not sell or rent your data.</strong> We also do not
            share your YouTube data with third parties except:
          </p>
          <ul>
            <li>With your explicit consent</li>
            <li>To comply with legal obligations or lawful requests</li>
            <li>
              To protect the rights, property, or safety of {BRAND.name}, our
              users, or the public
            </li>
            <li>
              With vetted service providers who process data on our behalf to
              run
              {BRAND.name} features (for example, AI insight generation), under
              confidentiality and security obligations
            </li>
          </ul>

          <h3>3.6 Google Limited Use Disclosure</h3>
          <p>
            {BRAND.name}&apos;s use and transfer to any other app of information
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

          <h3>3.7 AI Processing (User-Facing Features)</h3>
          <p>
            {BRAND.name} may use third-party AI services (for example, OpenAI’s
            API) to generate user-facing insights such as summaries, comment
            theme/sentiment analysis, and content recommendations.
          </p>
          <ul>
            <li>
              <strong>What we send:</strong> Only the minimum information needed
              for the feature you requested (e.g., specific video
              titles/descriptions, selected analytics metrics, and/or selected
              comment text when you use comment analysis).
            </li>
            <li>
              <strong>Purpose limitation:</strong> AI processing is used only to
              provide the in-product feature you are actively using.
            </li>
            <li>
              <strong>No generalized training:</strong> We do not enable
              optional data-sharing settings with our AI provider that would
              allow our API inputs/outputs to be used to improve or train
              general models.
            </li>
            <li>
              <strong>No ads / no selling:</strong> We do not use Google/YouTube
              user data for advertising, and we do not sell Google/YouTube user
              data.
            </li>
          </ul>
        </section>

        <section className={s.section}>
          <h2>4. Data Security</h2>
          <p>
            We implement technical and organizational measures designed to
            protect your information against unauthorized access, alteration,
            disclosure, or destruction, including:
          </p>
          <ul>
            <li>Encryption of sensitive data at rest and in transit</li>
            <li>Access controls and authentication requirements</li>
            <li>
              Monitoring and safeguards to reduce abuse and unauthorized access
            </li>
          </ul>
        </section>

        <section className={s.section}>
          <h2>5. Data Retention</h2>
          <p>Retention depends on the category of data:</p>
          <ul>
            <li>
              <strong>Account data</strong> – retained until you delete your
              account or request deletion.
            </li>
            <li>
              <strong>OAuth tokens</strong> – retained until you disconnect
              YouTube, revoke access, or delete your account.
            </li>
            <li>
              <strong>Cached YouTube API data</strong> – typically retained for
              approximately <strong>12 hours</strong> before refresh, unless a
              longer period is required for security, debugging, or legal
              compliance.
            </li>
            <li>
              <strong>Saved/derived outputs</strong> (e.g., insight summaries
              you choose to keep) – retained until you delete them or delete
              your account.
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
            <li>Export your data (where available)</li>
            <li>Revoke YouTube API access at any time</li>
          </ul>

          <h3>How to Revoke YouTube Access</h3>
          <p>
            You can revoke {BRAND.name}&apos;s access to your YouTube data at
            any time by:
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
              Finding &quot;{BRAND.name}&quot; in the list of third-party apps
              with access
            </li>
            <li>Clicking &quot;Remove Access&quot;</li>
          </ol>
          <p>
            After revocation, we can no longer access new YouTube data. Cached
            data will expire on its normal schedule (typically ~12 hours) unless
            you request deletion sooner.
          </p>
        </section>

        <section className={s.section}>
          <h2>7. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify
            you of material changes by posting the updated policy on this page
            and updating the &quot;Last updated&quot; date.
          </p>
        </section>

        <section className={s.section}>
          <h2>8. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy or wish to exercise
            your rights, please{" "}
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
