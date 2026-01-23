"use client";

import styles from "./ui.module.css";

type Action = {
  label: string;
  onClick?: () => void;
  href?: string;
  variant?: "primary" | "secondary";
};

type NextStepsProps = {
  title?: string;
  description?: string;
  actions: Action[];
};

/**
 * NextSteps - Actionable tasks with buttons
 * Clean, focused CTAs without fluff
 */
export function NextSteps({
  title = "Next steps",
  description,
  actions,
}: NextStepsProps) {
  if (actions.length === 0) return null;

  return (
    <div className={styles.nextSteps}>
      <div className={styles.nextStepsHeader}>
        <h4 className={styles.nextStepsTitle}>{title}</h4>
        {description && (
          <p className={styles.nextStepsDesc}>{description}</p>
        )}
      </div>
      <div className={styles.nextStepsActions}>
        {actions.map((action, i) => {
          const variant = action.variant ?? (i === 0 ? "primary" : "secondary");
          const className = `${styles.nextStepsBtn} ${styles[`btn-${variant}`]}`;

          if (action.href) {
            return (
              <a
                key={i}
                href={action.href}
                className={className}
                target={action.href.startsWith("http") ? "_blank" : undefined}
                rel={action.href.startsWith("http") ? "noopener noreferrer" : undefined}
              >
                {action.label}
                {action.href.startsWith("http") && (
                  <svg
                    className={styles.externalIcon}
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
                  </svg>
                )}
              </a>
            );
          }

          return (
            <button
              key={i}
              onClick={action.onClick}
              className={className}
              type="button"
            >
              {action.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default NextSteps;
