import s from "./style.module.css";

export const metadata = {
  title: "Privacy Policy | YT Growth",
  description: "Privacy Policy for YT Growth",
};

export default function PrivacyPage() {
  return (
    <main className={s.container}>
      <div className={s.content}>
        <h1 className={s.title}>Privacy Policy</h1>
        <p className={s.updated}>Last updated: December 2024</p>

        <section className={s.section}>
          <h2>1. Information We Collect</h2>
          <p>
            When you use YT Growth, we collect information you provide directly to us, including:
          </p>
          <ul>
            <li>Account information (email address, name)</li>
            <li>YouTube channel data you authorize us to access</li>
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
          <h2>3. YouTube API Services</h2>
          <p>
            YT Growth uses YouTube API Services. By using our service, you are also agreeing to be 
            bound by the{" "}
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
            </a>.
          </p>
        </section>

        <section className={s.section}>
          <h2>4. Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your personal 
            information against unauthorized access, alteration, disclosure, or destruction.
          </p>
        </section>

        <section className={s.section}>
          <h2>5. Data Retention</h2>
          <p>
            We retain your information for as long as your account is active or as needed to provide 
            you services. You can request deletion of your data at any time by contacting us.
          </p>
        </section>

        <section className={s.section}>
          <h2>6. Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access the personal data we hold about you</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Revoke YouTube API access at any time</li>
          </ul>
        </section>

        <section className={s.section}>
          <h2>7. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please{" "}
            <a href="/contact" className={s.link}>contact us</a>.
          </p>
        </section>
      </div>
    </main>
  );
}

