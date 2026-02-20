/**
 * ArticleShell - Reusable page shell for all marketing articles.
 *
 * Layout:
 *   Desktop: sticky left TOC sidebar + main content column
 *   Mobile:  collapsible TOC at top, then content
 *
 * Main column order:
 *   1. Hero image (optional)
 *   2. Title
 *   3. Description
 *   4. Horizontal separator
 *   5. children (article body)
 *
 * Server component - the ActiveToc child is the only client piece.
 */

import Image from "next/image";
import type { StaticImageData } from "next/image";
import { ActiveToc } from "./ActiveToc";
import styles from "../../style.module.css";

interface TocItem {
  readonly id: string;
  readonly label: string;
  readonly level?: number;
}

interface ArticleShellProps {
  heroImage?: string | StaticImageData;
  heroAlt?: string;
  title: string;
  description: string;
  toc: readonly TocItem[];
  children: React.ReactNode;
}

export function ArticleShell({
  heroImage,
  heroAlt = "",
  title,
  description,
  toc,
  children,
}: ArticleShellProps) {
  return (
    <div className={styles.shellLayout}>
      {/* Sidebar TOC + Mobile TOC are rendered inside ActiveToc */}
      <ActiveToc items={toc} />

      {/* Main content column */}
      <div className={styles.shellMain}>
        {heroImage && (
          <div className={styles.shellHero}>
            <Image
              src={heroImage}
              alt={heroAlt}
              width={960}
              height={540}
              className={styles.shellHeroImage}
              priority
              sizes="(max-width: 768px) 100vw, 720px"
            />
          </div>
        )}

        <h1 className={styles.shellTitle}>{title}</h1>
        <p className={styles.shellDescription}>{description}</p>

        <hr className={styles.shellSeparator} />

        <div className={styles.shellContent}>{children}</div>
      </div>
    </div>
  );
}
