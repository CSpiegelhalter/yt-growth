import Link from "next/link";

import s from "@/app/(app)/analyze/style.module.css";

type Props = {
  remaining: number;
};

/**
 * UsageLimitBanner - Shows the user how many free analyses they have left.
 *
 * - Amber style when N > 0 ("N analyses remaining today")
 * - Pink gradient when depleted — redirects to /trending instead of "come back tomorrow"
 */
export function UsageLimitBanner({ remaining }: Props) {
  if (remaining > 2) return null;

  const depleted = remaining <= 0;

  return (
    <div className={`${s.usageBanner} ${depleted ? s.usageBannerDepleted : s.usageBannerRemaining}`}>
      <span className={s.usageBannerIcon}>{depleted ? "\u26A0" : "\u23F3"}</span>
      <span className={s.usageBannerText}>
        {depleted ? (
          <>
            <strong>You&apos;ve used all free analyses today.</strong>{" "}
            <Link href="/auth/signup" className={s.usageBannerLink}>Sign up to keep analyzing</Link>
            {" \u2014 free forever. Or "}
            <Link href="/trending" className={s.usageBannerLink}>explore trending topics</Link>
            {" while you wait."}
          </>
        ) : (
          <>
            <strong>{remaining} free {remaining === 1 ? "analysis" : "analyses"} remaining</strong>{" "}
            today.{" "}
            <Link href="/auth/signup" className={s.usageBannerLink}>Sign up for unlimited</Link>.
          </>
        )}
      </span>
    </div>
  );
}
