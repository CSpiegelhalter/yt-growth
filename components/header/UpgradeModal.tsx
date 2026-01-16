import Link from "next/link";
import { LIMITS } from "@/lib/product";
import s from "../Header.module.css";

type UpgradeModalProps = {
  channelLimit: number;
  onClose: () => void;
};

/**
 * Modal shown when user tries to add a channel but has reached their limit.
 */
export function UpgradeModal({ channelLimit, onClose }: UpgradeModalProps) {
  const canUpgrade = channelLimit < LIMITS.PRO_MAX_CONNECTED_CHANNELS;

  return (
    <div className={s.modalOverlay} onClick={onClose}>
      <div className={s.modal} onClick={(e) => e.stopPropagation()}>
        <button
          className={s.modalClose}
          onClick={onClose}
          type="button"
          aria-label="Close"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
        <div className={s.modalIcon}>
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className={s.modalTitle}>Channel Limit Reached</h3>
        <p className={s.modalDesc}>
          {canUpgrade
            ? `Your current plan allows ${channelLimit} channel${
                channelLimit === 1 ? "" : "s"
              }. Upgrade to Pro to connect up to ${
                LIMITS.PRO_MAX_CONNECTED_CHANNELS
              } channels.`
            : `You've reached the maximum of ${channelLimit} channels for your plan.`}
        </p>
        {canUpgrade && (
          <Link
            href="/api/integrations/stripe/checkout"
            className={s.modalUpgradeBtn}
            onClick={onClose}
          >
            Upgrade to Pro
          </Link>
        )}
        <button className={s.modalDismissBtn} onClick={onClose} type="button">
          {canUpgrade ? "Maybe Later" : "Got it"}
        </button>
      </div>
    </div>
  );
}
