"use client";

import { useState } from "react";

import { CopyButton } from "../../ui/CopyButton";
import s from "./discoverability.module.css";

type DescriptionBlockProps = {
  description: string;
};

export function DescriptionBlock({ description }: DescriptionBlockProps) {
  const [expanded, setExpanded] = useState(false);

  if (!description) { return null; }

  return (
    <div className={s.descriptionBlock}>
      <div className={s.descriptionTop}>
        <span className={s.descriptionBlockLabel}>SEO Description</span>
        <CopyButton text={description} variant="icon" />
      </div>
      <p className={`${s.descriptionText} ${expanded ? "" : s.descriptionClamped}`}>
        {description}
      </p>
      <button
        type="button"
        className={s.showMoreBtn}
        onClick={() => setExpanded((prev) => !prev)}
      >
        {expanded ? "Show Less" : "Show More"}
      </button>
    </div>
  );
}
