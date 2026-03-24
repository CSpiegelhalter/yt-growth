"use client";

import { useCallback, useRef, useState } from "react";

import { startCheckout } from "@/lib/client/checkout";
import { useBodyScrollLock } from "@/lib/client/use-body-scroll-lock";
import { useEscapeKey } from "@/lib/client/use-escape-key";

import s from "./PricingModal.module.css";
import { UpgradeCard } from "./UpgradeCard";

type PricingModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function PricingModal({ isOpen, onClose }: PricingModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEscapeKey(isOpen, onClose);
  useBodyScrollLock(isOpen);

  const handlePurchase = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const url = await startCheckout();
      window.location.href = url;
    } catch (error_) {
      setError(
        error_ instanceof Error
          ? error_.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  if (!isOpen) {return null;}

  return (
    <div
      className={s.overlay}
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) {onClose();}
      }}
    >
      <div
        ref={modalRef}
        className={s.modal}
        role="dialog"
        aria-modal="true"
        aria-label="Upgrade to Pro"
        tabIndex={-1}
      >
        <button
          type="button"
          className={s.closeBtn}
          onClick={onClose}
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

        {error && (
          <div className={s.error} role="alert">
            {error}
          </div>
        )}

        <UpgradeCard
          onPurchase={handlePurchase}
          isPro={false}
          loading={loading}
        />
      </div>
    </div>
  );
}
