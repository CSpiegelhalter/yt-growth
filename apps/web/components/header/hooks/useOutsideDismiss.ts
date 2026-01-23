import { useEffect, type RefObject } from "react";

type UseOutsideDismissOptions = {
  /** Whether the dismiss behavior is active */
  open: boolean;
  /** Refs to elements that should NOT trigger dismiss when clicked */
  refs: RefObject<HTMLElement | null>[];
  /** Callback when dismiss is triggered (outside click or Escape) */
  onDismiss: () => void;
};

/**
 * Hook to handle outside click and Escape key dismissal.
 * Only activates listeners when `open` is true.
 */
export function useOutsideDismiss({
  open,
  refs,
  onDismiss,
}: UseOutsideDismissOptions): void {
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const isInsideAnyRef = refs.some(
        (ref) => ref.current && ref.current.contains(target)
      );
      if (!isInsideAnyRef) {
        onDismiss();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onDismiss();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, refs, onDismiss]);
}
