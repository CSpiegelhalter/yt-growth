"use client";

import s from "../style.module.css";

type WinLeak = {
  label: string;
  why: string;
};

type WinsLeaksProps = {
  wins: WinLeak[];
  leaks: WinLeak[];
};

/**
 * WinsLeaks - What's working vs what needs work
 */
export function WinsLeaks({ wins, leaks }: WinsLeaksProps) {
  if (wins.length === 0 && leaks.length === 0) {
    return null;
  }

  return (
    <section className={s.winsLeaks}>
      {wins.length > 0 && (
        <div className={s.winsCol}>
          <h3 className={s.colTitle}>
            <span className={s.winDot} />
            What{"'"}s Working
          </h3>
          <div className={s.colCards}>
            {wins.map((win, i) => (
              <div key={i} className={s.winCard}>
                <strong>{win.label}</strong>
                <span>{win.why}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {leaks.length > 0 && (
        <div className={s.leaksCol}>
          <h3 className={s.colTitle}>
            <span className={s.leakDot} />
            Needs Work
          </h3>
          <div className={s.colCards}>
            {leaks.map((leak, i) => (
              <div key={i} className={s.leakCard}>
                <strong>{leak.label}</strong>
                <span>{leak.why}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

