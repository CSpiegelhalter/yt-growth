"use client";

import s from "../style.module.css";
import { CopyButton } from "./CopyButton";

type RemixItem = {
  id: string;
  title: string;
  hook: string;
  keywords?: string[];
};

type RemixIdeasProps = {
  remixes: RemixItem[];
};

/**
 * RemixIdeas - Spin-off video concepts based on what worked
 */
export function RemixIdeas({ remixes }: RemixIdeasProps) {
  if (!remixes || remixes.length === 0) {
    return null;
  }

  return (
    <section className={s.remixes}>
      <h2 className={s.sectionTitle}>Video Ideas From This</h2>
      <p className={s.sectionDesc}>
        Spin-off concepts inspired by what worked
      </p>

      <div className={s.remixGrid}>
        {remixes.slice(0, 6).map((remix) => (
          <div key={remix.id} className={s.remixCard}>
            <h4 className={s.remixTitle}>{remix.title}</h4>
            <p className={s.remixHook}>&quot;{remix.hook}&quot;</p>
            <div className={s.remixActions}>
              <CopyButton text={remix.title} label="Copy title" />
              <CopyButton text={remix.hook} label="Copy hook" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

