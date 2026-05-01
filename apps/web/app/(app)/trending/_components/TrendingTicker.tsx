"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import s from "../style.module.css";

type TrendingTopic = {
  query: string;
  searchVolume?: number;
  increasePercentage?: number;
  category?: string;
  formattedTraffic?: string;
  relatedQueries: string[];
};

function formatVolume(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
}

function formatIncrease(pct: number): string {
  if (pct >= 10_000) return `${Math.round(pct / 1_000)}K%`;
  if (pct >= 1_000) return `${(pct / 1_000).toFixed(1)}K%`;
  return `${pct}%`;
}

export function TrendingTicker() {
  const router = useRouter();
  const [topics, setTopics] = useState<TrendingTopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/keywords/trending-now")
      .then((res) => res.json())
      .then((data: { topics: TrendingTopic[] }) => {
        setTopics(data.topics?.slice(0, 10) ?? []);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const handleClick = useCallback(
    (query: string) => {
      router.push(`/keywords?q=${encodeURIComponent(query)}`);
    },
    [router],
  );

  if (!isLoading && topics.length === 0) return null;

  return (
    <section className={s.tickerSection}>
      <div className={s.tickerHeader}>
        <div className={s.tickerHeaderLeft}>
          <span className={s.tickerPulse} />
          <h2 className={s.tickerTitle}>Trending Now</h2>
        </div>
        <span className={s.tickerMeta}>Updated hourly from Google Trends</span>
      </div>

      {isLoading ? (
        <div className={s.tickerScroll}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={s.tickerItemSkeleton} />
          ))}
        </div>
      ) : (
        <div className={s.tickerScroll}>
          {topics.map((topic, i) => {
            const volume = topic.searchVolume ?? 0;
            const increase = topic.increasePercentage ?? 0;

            return (
              <button
                key={topic.query}
                type="button"
                className={s.tickerItem}
                onClick={() => handleClick(topic.query)}
              >
                <div className={s.tickerItemTop}>
                  <span className={s.tickerRank}>#{i + 1}</span>
                  {topic.category && (
                    <span className={s.tickerCategory}>{topic.category}</span>
                  )}
                </div>
                <span className={s.tickerQuery}>{topic.query}</span>
                <div className={s.tickerStats}>
                  {volume > 0 && (
                    <span className={s.tickerVolume}>
                      {formatVolume(volume)} searches
                    </span>
                  )}
                  {increase > 0 && (
                    <span className={s.tickerIncrease}>
                      +{formatIncrease(increase)}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
