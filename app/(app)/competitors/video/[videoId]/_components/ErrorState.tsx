/**
 * ErrorState - Server component for error display.
 *
 * Since server components cannot use router.back(), we render a link instead.
 * Visual UI matches the original VideoDetailClient error state.
 */
import Link from "next/link";
import s from "../style.module.css";

type Props = {
  title: string;
  description?: string;
  activeChannelId?: string;
};

export default function ErrorState({
  title,
  description = "We couldn't analyze this competitor video.",
  activeChannelId,
}: Props) {
  const backHref = activeChannelId
    ? `/competitors?channelId=${encodeURIComponent(activeChannelId)}`
    : "/competitors";

  return (
    <main className={s.page}>
      <div className={s.errorState}>
        <div className={s.errorIcon}>
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
        </div>
        <h2 className={s.errorTitle}>{title}</h2>
        <p className={s.errorDesc}>{description}</p>
        <Link href={backHref} className={s.backBtn}>
          Go Back
        </Link>
      </div>
    </main>
  );
}
