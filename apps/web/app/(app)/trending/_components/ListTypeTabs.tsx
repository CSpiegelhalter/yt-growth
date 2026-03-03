"use client";

import s from "../style.module.css";
import type { DiscoveryListType } from "../types";
import { LIST_TYPE_OPTIONS } from "../types";

type Props = {
  listType: DiscoveryListType;
  onListTypeChange: (type: DiscoveryListType) => void;
};

const TAB_ICONS: Record<DiscoveryListType, React.ReactNode> = {
  fastest_growing: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  breakouts: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  ),
  emerging_niches: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  low_competition: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
};

export function ListTypeTabs({ listType, onListTypeChange }: Props) {
  return (
    <div className={s.listTypeTabs} role="tablist" aria-label="Discovery type">
      {(Object.keys(LIST_TYPE_OPTIONS) as DiscoveryListType[]).map((type) => (
        <button
          key={type}
          type="button"
          role="tab"
          aria-selected={listType === type}
          className={`${s.listTypeTab} ${listType === type ? s.listTypeTabActive : ""}`}
          onClick={() => onListTypeChange(type)}
        >
          <span className={s.listTypeTabIcon}>{TAB_ICONS[type]}</span>
          <span className={s.listTypeTabLabel}>
            {LIST_TYPE_OPTIONS[type].label}
          </span>
        </button>
      ))}
    </div>
  );
}
