"use client";

import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import s from "./style.module.css";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Optional action button in footer */
  actionLabel?: string;
  onAction?: () => void;
  /** Optional secondary action (e.g. Reset) */
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
};

/**
 * FilterDrawer - Mobile bottom sheet for filters
 *
 * A reusable bottom sheet component that:
 * - Slides up from the bottom
 * - Has backdrop + click-outside-to-close
 * - Traps focus when open
 * - Closes on Escape
 * - Renders via portal to escape stacking context
 */
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

  // Handle Escape key
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

  // Prevent body scroll when open
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

  // Focus trap
  useEffect(() => {
    if (!isOpen || !drawerRef.current) return;

    const drawer = drawerRef.current;
    const focusableElements = drawer.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus close button on open
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
      className={s.filterDrawerBackdrop}
      onClick={handleBackdropClick}
      aria-hidden="true"
    >
      <div
        ref={drawerRef}
        className={s.filterDrawer}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* Handle (visual affordance for swipe) */}
        <div className={s.filterDrawerHandle} aria-hidden="true" />

        {/* Header */}
        <div className={s.filterDrawerHeader}>
          <h2 className={s.filterDrawerTitle}>{title}</h2>
          <button
            ref={closeButtonRef}
            type="button"
            className={s.filterDrawerClose}
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

        {/* Content */}
        <div className={s.filterDrawerContent}>{children}</div>

        {/* Footer (optional action) */}
        {(actionLabel && onAction) || (secondaryActionLabel && onSecondaryAction) ? (
          <div className={s.filterDrawerFooter}>
            {secondaryActionLabel && onSecondaryAction && (
              <button
                type="button"
                className={s.filterDrawerSecondaryAction}
                onClick={onSecondaryAction}
              >
                {secondaryActionLabel}
              </button>
            )}
            {actionLabel && onAction && (
              <button
                type="button"
                className={s.filterDrawerAction}
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

  // Render via portal to body
  if (typeof window === "undefined") return null;
  return createPortal(content, document.body);
}
