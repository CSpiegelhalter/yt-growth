"use client";

import { useCallback, useEffect, useState } from "react";

import s from "../keywords.module.css";

type TrendingTopic = {
  query: string;
  formattedTraffic: string | number;
  relatedQueries: string[];
  articles: { title: string; source: string; url: string }[];
};

type Props = {
  onTopicClick: (keyword: string) => void;
};

function parseTraffic(traffic: string | number | undefined | null): number {
  if (!traffic) return 0;
  const str = String(traffic);
  const cleaned = str.replace(/[+,]/g, "").trim();
  const match = cleaned.match(/^([\d.]+)\s*(M|K)?$/i);
  if (!match) return 0;
  const num = Number.parseFloat(match[1]);
  const unit = (match[2] ?? "").toUpperCase();
  if (unit === "M") return num * 1_000_000;
  if (unit === "K") return num * 1_000;
  return num;
}

function formatTrafficShort(traffic: string | number | undefined | null): string {
  if (!traffic) return "";
  const str = String(traffic);
  if (str.includes("K") || str.includes("M")) return str;
  const n = parseTraffic(traffic);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M+`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K+`;
  return str;
}

export function TrendingNowBar({ onTopicClick }: Props) {
  const [topics, setTopics] = useState<TrendingTopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/keywords/trending-now")
      .then((res) => res.json())
      .then((data: { topics: TrendingTopic[] }) => {
        setTopics(data.topics?.slice(0, 12) ?? []);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const handleClick = useCallback(
    (query: string) => onTopicClick(query),
    [onTopicClick],
  );

  if (!isLoading && topics.length === 0) return null;

  const maxTraffic = Math.max(...topics.map((t) => parseTraffic(t.formattedTraffic)), 1);
  const featured = topics.slice(0, 3);
  const rest = topics.slice(3);

  return (
    <section className={s.trendingSection}>
      {/* Header */}
      <div className={s.trendingHeader}>
        <div className={s.trendingHeaderLeft}>
          <span className={s.trendingPulse} />
          <h2 className={s.trendingTitle}>Trending Now</h2>
        </div>
        <span className={s.trendingMeta}>
          Updated hourly from Google Trends
        </span>
      </div>

      {isLoading ? (
        <TrendingSkeleton />
      ) : (
        <>
          {/* Top 3 featured cards */}
          <div className={s.trendingFeatured}>
            {featured.map((topic, i) => {
              const traffic = parseTraffic(topic.formattedTraffic);
              const barPct = Math.max(12, (traffic / maxTraffic) * 100);
              return (
                <button
                  key={topic.query}
                  type="button"
                  className={s.trendingFeaturedCard}
                  onClick={() => handleClick(topic.query)}
                >
                  <div className={s.featuredTop}>
                    <span className={`${s.featuredRank} ${i === 0 ? s.featuredRankGold : ""}`}>
                      {i + 1}
                    </span>
                    <span className={s.featuredTraffic}>
                      {formatTrafficShort(topic.formattedTraffic)}
                    </span>
                  </div>
                  <h3 className={s.featuredQuery}>{topic.query}</h3>

                  {/* Inline bar */}
                  <div className={s.featuredBarTrack}>
                    <div
                      className={s.featuredBarFill}
                      style={{
                        width: `${barPct}%`,
                        animationDelay: `${i * 120}ms`,
                      }}
                    />
                  </div>

                  {/* Related queries */}
                  {topic.relatedQueries.length > 0 && (
                    <div className={s.featuredRelated}>
                      {topic.relatedQueries.slice(0, 3).map((q) => (
                        <span key={q} className={s.featuredTag}>{q}</span>
                      ))}
                    </div>
                  )}

                  {/* Headline */}
                  {topic.articles[0] && (
                    <p className={s.featuredHeadline}>
                      {topic.articles[0].title}
                    </p>
                  )}
                </button>
              );
            })}
          </div>

          {/* Remaining trends — compact ranked list */}
          {rest.length > 0 && (
            <div className={s.trendingList}>
              {rest.map((topic, i) => {
                const traffic = parseTraffic(topic.formattedTraffic);
                const barPct = Math.max(8, (traffic / maxTraffic) * 100);
                return (
                  <button
                    key={topic.query}
                    type="button"
                    className={s.trendingListItem}
                    onClick={() => handleClick(topic.query)}
                  >
                    <span className={s.listRank}>{i + 4}</span>
                    <span className={s.listQuery}>{topic.query}</span>
                    <div className={s.listBarTrack}>
                      <div
                        className={s.listBarFill}
                        style={{
                          width: `${barPct}%`,
                          animationDelay: `${(i + 3) * 80}ms`,
                        }}
                      />
                    </div>
                    <span className={s.listTraffic}>
                      {formatTrafficShort(topic.formattedTraffic)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
}

function TrendingSkeleton() {
  return (
    <>
      <div className={s.trendingFeatured}>
        {[0, 1, 2].map((i) => (
          <div key={i} className={s.skeletonFeatured}>
            <div className={s.skeletonLine} style={{ width: "40%", height: 12 }} />
            <div className={s.skeletonLine} style={{ width: "80%", height: 18, marginTop: 8 }} />
            <div className={s.skeletonLine} style={{ width: "60%", height: 6, marginTop: 12 }} />
            <div className={s.skeletonLine} style={{ width: "90%", height: 10, marginTop: 10 }} />
          </div>
        ))}
      </div>
      <div className={s.trendingList}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={s.skeletonListItem}>
            <div className={s.skeletonLine} style={{ width: 20, height: 14 }} />
            <div className={s.skeletonLine} style={{ width: "30%", height: 14, flex: 1 }} />
            <div className={s.skeletonLine} style={{ width: "20%", height: 6 }} />
            <div className={s.skeletonLine} style={{ width: 40, height: 12 }} />
          </div>
        ))}
      </div>
    </>
  );
}
