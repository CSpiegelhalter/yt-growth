"use client";

import { useState, useRef, useCallback, memo } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useOutsideDismiss } from "./hooks/useOutsideDismiss";
import { DropdownIcon, type IconType } from "./icons";
import { withChannelId, truncateEmail } from "./utils";
import s from "../Header.module.css";

/**
 * Navigation links - static, never changes.
 * Defined at module level to avoid recreation.
 */
const NAV_LINKS: { href: string; label: string; icon: IconType }[] = [
  { href: "/dashboard", label: "Videos", icon: "video" },
  { href: "/ideas", label: "Ideas", icon: "lightbulb" },
  { href: "/goals", label: "Goals", icon: "target" },
  { href: "/competitors", label: "Competitors", icon: "trophy" },
  { href: "/tag-generator", label: "Tag Generator", icon: "tag" },
];

type UserMenuProps = {
  userEmail: string;
  userName: string | null | undefined;
  userInitials: string;
  activeChannelId: string | null;
  isAdmin: boolean;
};

/**
 * User menu dropdown with navigation links.
 * Manages only its own open/close state.
 */
export const UserMenu = memo(function UserMenu({
  userEmail,
  userName,
  userInitials,
  activeChannelId,
  isAdmin,
}: UserMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleDismiss = useCallback(() => setMenuOpen(false), []);

  useOutsideDismiss({
    open: menuOpen,
    refs: [menuRef],
    onDismiss: handleDismiss,
  });

  const handleToggle = useCallback(() => {
    setMenuOpen((prev) => !prev);
  }, []);

  const handleClose = useCallback(() => {
    setMenuOpen(false);
  }, []);

  const handleSignOut = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setMenuOpen(false);
    void signOut({ callbackUrl: "/" });
  }, []);

  const displayName = userName || truncateEmail(userEmail);

  return (
    <div ref={menuRef} style={{ position: "relative" }}>
      <button
        onClick={handleToggle}
        className={s.userMenuBtn}
        aria-label="User menu"
        aria-expanded={menuOpen}
        type="button"
      >
        <div className={s.avatar}>{userInitials}</div>
        <span className={s.userName}>{displayName}</span>
        <span className={s.menuChevron}>{menuOpen ? "▲" : "▼"}</span>
      </button>

      {menuOpen && (
        <>
          <div className={s.backdrop} onClick={handleClose} />
          <div className={s.dropdown}>
            <div className={s.dropdownEmail}>{userEmail}</div>

            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={withChannelId(link.href, activeChannelId)}
                className={s.dropdownItem}
                onClick={handleClose}
              >
                <DropdownIcon type={link.icon} />
                {link.label}
              </Link>
            ))}

            <div className={s.dropdownDivider} />

            <Link
              href="/saved-ideas"
              className={s.dropdownItem}
              onClick={handleClose}
            >
              <DropdownIcon type="bookmark" />
              Saved Ideas
            </Link>

            <Link
              href="/profile"
              className={s.dropdownItem}
              onClick={handleClose}
            >
              <DropdownIcon type="user" />
              Profile
            </Link>

            <Link
              href="/contact"
              className={s.dropdownItem}
              onClick={handleClose}
            >
              <DropdownIcon type="mail" />
              Contact
            </Link>

            <Link
              href="/learn"
              className={s.dropdownItem}
              onClick={handleClose}
            >
              <DropdownIcon type="book" />
              Learn
            </Link>

            {isAdmin && (
              <Link
                href="/admin/youtube-usage"
                className={s.dropdownItem}
                onClick={handleClose}
              >
                <DropdownIcon type="settings" />
                Admin: API Usage
              </Link>
            )}

            <div className={s.dropdownDivider} />

            <Link
              href="/api/auth/signout"
              className={`${s.dropdownItem} ${s.dropdownSignout}`}
              onClick={handleSignOut}
            >
              <DropdownIcon type="logout" />
              Sign out
            </Link>
          </div>
        </>
      )}
    </div>
  );
});
