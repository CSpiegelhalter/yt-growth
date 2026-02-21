"use client";

import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useFocusTrap } from "@/lib/client/use-focus-trap";
import { useEscapeKey } from "@/lib/client/use-escape-key";
import { useBodyScrollLock } from "@/lib/client/use-body-scroll-lock";
import s from "./style.module.css";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
};

export default function FilterDrawer({
  isOpen,
  onClose,
  title,
  children,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}: Props) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEscapeKey(isOpen, onClose);

  useBodyScrollLock(isOpen);

  useFocusTrap(drawerRef, isOpen, { autoFocus: false });

  useEffect(() => {
    if (isOpen) closeButtonRef.current?.focus();
  }, [isOpen]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  if (!isOpen) return null;

  const content = (
    <div
      className={s.backdrop}
      onClick={handleBackdropClick}
      aria-hidden="true"
    >
      <div
        ref={drawerRef}
        className={s.drawer}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className={s.handle} aria-hidden="true" />

        <div className={s.header}>
          <h2 className={s.title}>{title}</h2>
          <button
            ref={closeButtonRef}
            type="button"
            className={s.close}
            onClick={onClose}
            aria-label="Close filters"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className={s.content}>{children}</div>

        {(actionLabel && onAction) ||
        (secondaryActionLabel && onSecondaryAction) ? (
          <div className={s.footer}>
            {secondaryActionLabel && onSecondaryAction && (
              <button
                type="button"
                className={s.secondaryAction}
                onClick={onSecondaryAction}
              >
                {secondaryActionLabel}
              </button>
            )}
            {actionLabel && onAction && (
              <button
                type="button"
                className={s.primaryAction}
                onClick={onAction}
              >
                {actionLabel}
              </button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );

  if (typeof window === "undefined") return null;
  return createPortal(content, document.body);
}
