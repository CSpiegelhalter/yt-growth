import Link from "next/link";
import s from "./Tabs.module.css";

export type TabItem = {
  id: string;
  label: string;
  href?: string;
  icon?: React.ReactNode;
  badge?: string | number;
  onClick?: () => void;
};

type TabsProps = {
  items: TabItem[];
  activeId: string;
  onTabChange?: (id: string) => void;
  ariaLabel?: string;
};

/**
 * Unified Tab component used across the app.
 * Supports both Link-based tabs (for navigation) and button-based tabs (for state changes).
 *
 * Uses global CSS variables for consistent styling:
 * - --tab-container-bg
 * - --tab-bg, --tab-bg-hover, --tab-bg-active
 * - --tab-text, --tab-text-hover, --tab-text-active
 * - --tab-shadow-active
 */
export function Tabs({ items, activeId, onTabChange, ariaLabel }: TabsProps) {
  return (
    <nav className={s.tabNav} aria-label={ariaLabel || "Tabs"} role="tablist">
      {items.map((item) => {
        const isActive = item.id === activeId;
        const className = `${s.tabItem} ${isActive ? s.active : ""}`;

        // If href is provided, render as Link
        if (item.href) {
          return (
            <Link
              key={item.id}
              href={item.href}
              className={className}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${item.id}`}
              tabIndex={isActive ? 0 : -1}
            >
              {item.icon && <span className={s.tabIcon}>{item.icon}</span>}
              <span>{item.label}</span>
              {item.badge !== undefined && (
                <span className={s.tabBadge}>{item.badge}</span>
              )}
            </Link>
          );
        }

        // Otherwise render as button
        return (
          <button
            key={item.id}
            type="button"
            className={className}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${item.id}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => {
              item.onClick?.();
              onTabChange?.(item.id);
            }}
          >
            {item.icon && <span className={s.tabIcon}>{item.icon}</span>}
            <span>{item.label}</span>
            {item.badge !== undefined && (
              <span className={s.tabBadge}>{item.badge}</span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
