"use client";

import { type KeyboardEvent,useId, useState } from "react";

import type { CompetitorVideoAnalysis } from "@/types/api";

import s from "../style.module.css";
import { AnalysisSection } from "./AnalysisSection";

type Props = {
  whyCards: string[];
  themeCards: CompetitorVideoAnalysis["analysis"]["themesToRemix"];
  patternCards: string[];
};

type TabKey = "why" | "themes" | "patterns";

type Tab = {
  key: TabKey;
  label: string;
  render: () => React.ReactNode;
};

export function PatternsToBorrow({ whyCards, themeCards, patternCards }: Props) {
  const tabs: Tab[] = [];

  if (whyCards.length > 0) {
    tabs.push({
      key: "why",
      label: "What's working",
      render: () => (
        <div className={s.cardGrid}>
          {whyCards.map((text, i) => (
            <div key={i} className={s.simpleCard}>
              <p className={s.cardText}>{text}</p>
            </div>
          ))}
        </div>
      ),
    });
  }

  if (themeCards.length > 0) {
    tabs.push({
      key: "themes",
      label: "Portable patterns",
      render: () => (
        <div className={s.themesList}>
          {themeCards.map((theme, i) => (
            <div key={i} className={s.themeCard}>
              <h4 className={s.themeTitle}>{theme.theme}</h4>
              <p className={s.themeWhy}>{theme.why}</p>
            </div>
          ))}
        </div>
      ),
    });
  }

  if (patternCards.length > 0) {
    tabs.push({
      key: "patterns",
      label: "Title templates",
      render: () => (
        <div className={s.patternCards}>
          {patternCards.map((pattern, i) => (
            <div key={i} className={s.patternCard}>
              <h4 className={s.patternTitle}>{pattern}</h4>
              <p className={s.patternHow}>Write 2 variants using this pattern with your main keyword.</p>
            </div>
          ))}
        </div>
      ),
    });
  }

  const idBase = useId();
  const [activeKey, setActiveKey] = useState<TabKey | null>(tabs[0]?.key ?? null);

  if (tabs.length === 0) {return null;}

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") {return;}
    e.preventDefault();
    const dir = e.key === "ArrowRight" ? 1 : -1;
    const nextIndex = (index + dir + tabs.length) % tabs.length;
    setActiveKey(tabs[nextIndex].key);
    const nextEl = document.getElementById(`${idBase}-tab-${tabs[nextIndex].key}`);
    nextEl?.focus();
  };

  return (
    <AnalysisSection title="Patterns to borrow">
      <p className={s.sectionSubtitle}>Reference templates and patterns you can adapt for your own videos.</p>

      <div role="tablist" aria-label="Patterns to borrow" className={s.tabList}>
        {tabs.map((tab, i) => {
          const selected = tab.key === activeKey;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              id={`${idBase}-tab-${tab.key}`}
              aria-selected={selected}
              aria-controls={`${idBase}-panel-${tab.key}`}
              tabIndex={selected ? 0 : -1}
              className={`${s.tab} ${selected ? s.tabActive : ""}`}
              onClick={() => setActiveKey(tab.key)}
              onKeyDown={(e) => onKeyDown(e, i)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {tabs.map((tab) => (
        <div
          key={tab.key}
          role="tabpanel"
          id={`${idBase}-panel-${tab.key}`}
          aria-labelledby={`${idBase}-tab-${tab.key}`}
          hidden={tab.key !== activeKey}
          className={s.tabPanel}
        >
          {tab.render()}
        </div>
      ))}
    </AnalysisSection>
  );
}
