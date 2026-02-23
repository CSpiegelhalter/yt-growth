import { useEffect } from "react";

/**
 * Lock body scroll while a modal/drawer is open.
 */
export function useBodyScrollLock(isOpen: boolean) {
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);
}
