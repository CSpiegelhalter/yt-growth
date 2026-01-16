import { ReactNode } from "react";

type Props = {
  id: string;
  title: string;
  icon?: ReactNode;
  intro?: string;
  children: ReactNode;
};

/**
 * LearnSection - Consistent section wrapper for Learn articles
 * Provides proper spacing, semantic structure, and visual hierarchy
 */
export function LearnSection({ id, title, icon, intro, children }: Props) {
  return (
    <section id={id} className="learnSection">
      <h2 className="learnSection__title">
        {icon && <span className="learnSection__icon">{icon}</span>}
        {title}
      </h2>
      {intro && <p className="learnSection__intro">{intro}</p>}
      <div className="learnSection__content">{children}</div>
    </section>
  );
}
