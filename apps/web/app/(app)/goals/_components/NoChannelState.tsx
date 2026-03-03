import { PageContainer, PageHeader } from "@/components/ui";

import s from "../style.module.css";

export function NoChannelState() {
  return (
    <PageContainer>
      <PageHeader
        title="Badge Collection"
        subtitle="Collect badges as you grow your channel."
      />
      <div className={s.noChannel}>
        <div className={s.noChannelIcon}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M6 9H4.5a2.5 2.5 0 010-5H6M18 9h1.5a2.5 2.5 0 000-5H18M4 22h16M18 2H6v7a6 6 0 1012 0V2z" />
          </svg>
        </div>
        <h2 className={s.noChannelTitle}>Connect Your Channel</h2>
        <p className={s.noChannelDesc}>
          Link your YouTube channel to start collecting badges and tracking your growth.
        </p>
        <a href="/api/integrations/google/start" className={s.connectBtn}>
          Connect YouTube Channel
        </a>
      </div>
    </PageContainer>
  );
}
