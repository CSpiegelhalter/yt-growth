import Link from "next/link";
import { UserMenu } from "./UserMenu";
import s from "../Header.module.css";

type AuthAreaProps = {
  mounted: boolean;
  isLoading: boolean;
  isLoggedIn: boolean;
  userEmail: string;
  userName: string | null | undefined;
  userInitials: string;
  activeChannelId: string | null;
  isAdmin: boolean;
};

/**
 * Auth area - decides whether to show:
 * - Placeholder (not mounted or loading)
 * - UserMenu (logged in)
 * - Login/Signup buttons (logged out)
 */
export function AuthArea({
  mounted,
  isLoading,
  isLoggedIn,
  userEmail,
  userName,
  userInitials,
  activeChannelId,
  isAdmin,
}: AuthAreaProps) {
  // Show placeholder during SSR or loading to prevent hydration mismatch
  if (!mounted || isLoading) {
    return <div className={s.placeholder} />;
  }

  if (isLoggedIn) {
    return (
      <UserMenu
        userEmail={userEmail}
        userName={userName}
        userInitials={userInitials}
        activeChannelId={activeChannelId}
        isAdmin={isAdmin}
      />
    );
  }

  // Logged out view
  return (
    <>
      <Link href="/contact" className={s.contactBtn}>
        Contact
      </Link>
      <Link href="/auth/login" className={s.loginBtn}>
        Log in
      </Link>
      <Link href="/auth/signup" className={s.signupBtn}>
        Sign up
      </Link>
    </>
  );
}
