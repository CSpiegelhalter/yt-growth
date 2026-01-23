"use client";

import styles from "./ui.module.css";

type BulletItem = {
  text: string;
  detail?: string;
};

type BulletListProps = {
  type: "positive" | "negative" | "neutral";
  items: (string | BulletItem)[];
  title?: string;
};

/**
 * BulletList - Clean bulleted list for strengths/improvements
 * No emojis, just subtle color indicators
 */
export function BulletList({ type, items, title }: BulletListProps) {
  if (items.length === 0) return null;

  return (
    <div className={styles.bulletList}>
      {title && <h4 className={styles.bulletListTitle}>{title}</h4>}
      <ul className={`${styles.bulletListItems} ${styles[`bullets-${type}`]}`}>
        {items.map((item, i) => {
          const text = typeof item === "string" ? item : item.text;
          const detail = typeof item === "string" ? undefined : item.detail;
          return (
            <li key={i} className={styles.bulletItem}>
              <span className={styles.bulletDot} />
              <div className={styles.bulletContent}>
                <span className={styles.bulletText}>{text}</span>
                {detail && (
                  <span className={styles.bulletDetail}>{detail}</span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default BulletList;
