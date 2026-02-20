"use client";

import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
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

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !drawerRef.current) return;

    const drawer = drawerRef.current;
    const focusableElements = drawer.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    closeButtonRef.current?.focus();

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    drawer.addEventListener("keydown", handleTabKey);
    return () => drawer.removeEventListener("keydown", handleTabKey);
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
