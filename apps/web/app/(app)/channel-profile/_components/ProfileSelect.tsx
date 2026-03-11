"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import s from "./profile-select.module.css";

type Props = {
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
};

export function ProfileSelect({
  options,
  value,
  onChange,
  placeholder = "Select…",
  ariaLabel,
}: Props) {
  const [open, setOpen] = useState(false);
  const [focusIdx, setFocusIdx] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Close on click-outside
  useEffect(() => {
    if (!open) {
      return;
    }
    function handleClick(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Scroll focused option into view
  useEffect(() => {
    if (!open || focusIdx < 0 || !listRef.current) {
      return;
    }
    const el = listRef.current.children[focusIdx] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [open, focusIdx]);

  const toggle = useCallback(() => {
    setOpen((prev) => {
      if (!prev) {
        const idx = options.indexOf(value);
        setFocusIdx(idx !== -1 ? idx : 0);
      }
      return !prev;
    });
  }, [options, value]);

  const select = useCallback(
    (opt: string) => {
      onChange(opt);
      setOpen(false);
    },
    [onChange],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!open) {
        if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
          e.preventDefault();
          toggle();
        }
        return;
      }

      switch (e.key) {
        case "ArrowDown": {
          e.preventDefault();
          setFocusIdx((prev) => Math.min(prev + 1, options.length - 1));
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          setFocusIdx((prev) => Math.max(prev - 1, 0));
          break;
        }
        case "Enter": {
          e.preventDefault();
          if (focusIdx >= 0 && focusIdx < options.length) {
            select(options[focusIdx]);
          }
          break;
        }
        case "Escape": {
          e.preventDefault();
          setOpen(false);
          break;
        }
      }
    },
    [open, toggle, options, focusIdx, select],
  );

  const display = value || undefined;

  return (
    <div className={s.wrapper} ref={wrapperRef}>
      <button
        type="button"
        className={`${s.trigger}${open ? ` ${s.triggerOpen}` : ""}`}
        onClick={toggle}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
      >
        {display ? (
          <span>{display}</span>
        ) : (
          <span className={s.placeholder}>{placeholder}</span>
        )}
        <svg
          className={`${s.chevron}${open ? ` ${s.chevronOpen}` : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <ul
          className={s.dropdown}
          role="listbox"
          ref={listRef}
          aria-label={ariaLabel}
        >
          {options.map((opt, i) => (
            <li
              key={opt}
              role="option"
              aria-selected={opt === value}
              className={[
                s.option,
                i === focusIdx ? s.optionFocused : "",
                opt === value ? s.optionSelected : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onMouseEnter={() => setFocusIdx(i)}
              onKeyDown={handleKeyDown}
              onClick={() => select(opt)}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
