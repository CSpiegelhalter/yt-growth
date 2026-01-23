import { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

/**
 * TwoColumnList - Renders list items in a two-column grid on larger screens
 * Reduces visual density for long lists
 */
export function TwoColumnList({ children }: Props) {
  return <ul className="twoColumnList">{children}</ul>;
}
