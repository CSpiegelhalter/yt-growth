import Image from "next/image";

import s from "./suggestion-engine-card.module.css";

export function SuggestionEngineCard() {
  return (
    <article className={s.card}>
      <div className={s.fan} aria-hidden="true">
        <Image
          src="/dashboard/vid_card_1.svg"
          width={40}
          height={47}
          alt=""
          className={s.fanCard1}
        />
        <Image
          src="/dashboard/vid_card_2.svg"
          width={40}
          height={47}
          alt=""
          className={s.fanCard2}
        />
        <Image
          src="/dashboard/vid_card_3.svg"
          width={40}
          height={47}
          alt=""
          className={s.fanCard3}
        />
      </div>
      <div className={s.content}>
        <h3 className={s.title}>Our Suggestion Engine</h3>
        <p className={s.description}>
          We analyze your channel performance, niche trends, and audience signals
          to generate tailored video ideas. Each suggestion is designed to
          complement your existing content and help grow your channel.
        </p>
      </div>
      <svg
        className={s.infoIcon}
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    </article>
  );
}
