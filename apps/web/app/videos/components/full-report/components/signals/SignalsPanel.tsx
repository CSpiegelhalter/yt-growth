import type { SignalsData } from "@/lib/features/full-report";

import { SignalCard } from "./SignalCard";
import s from "./signals.module.css";

type SignalsPanelProps = {
  data: SignalsData;
};

export function SignalsPanel({ data }: SignalsPanelProps) {
  if (data.items.length === 0) {return null;}

  return (
    <section aria-labelledby="signals-heading" className={s.section}>
      <header className={s.sectionHead}>
        <h2 id="signals-heading" className={s.sectionTitle}>Patterns we noticed</h2>
        <p className={s.sectionSubtitle}>
          Cross-source findings from your transcript, retention curve, SEO, and channel baseline.
        </p>
      </header>
      <div className={s.list}>
        {data.items.map((signal) => (
          <SignalCard key={signal.id} signal={signal} />
        ))}
      </div>
    </section>
  );
}
