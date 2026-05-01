"use client";

import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AuthModal } from "@/components/auth";
import { PageContainer, PageHeader } from "@/components/ui";
import type { BriefAnchor, BriefIdea } from "@/lib/llm";

import type { RisingVideo } from "../../(app)/trending/types";
import s from "./dashboard-client.module.css";
import { useNicheTrending } from "./use-niche-trending";

const NICHES = [
  "Cooking", "Gaming", "Tech", "Fitness", "Beauty",
  "Education", "Finance", "Travel", "Music", "Comedy",
  "Science", "DIY", "Vlogging", "News",
] as const;

const SAVED_IDEAS_KEY = "dashboard.savedIdeas.v1";

type SavedIdea = {
  title: string;
  hook: string;
  niche: string;
  savedAt: string;
};

type BriefMeta = {
  tier?: "guest" | "FREE" | "PRO";
  remaining?: number | null;
};

type BriefResponse = {
  ideas: BriefIdea[];
  anchors: Array<BriefAnchor | null>;
  meta?: BriefMeta;
};

type LimitReason = "signup_required" | "upgrade_required" | null;

type BriefState = {
  niche: string | null;
  isLoading: boolean;
  error: string | null;
  limitReason: LimitReason;
  data: BriefResponse | null;
};

const INITIAL_STATE: BriefState = {
  niche: null,
  isLoading: false,
  error: null,
  limitReason: null,
  data: null,
};

type NichePulse = {
  gapCount: number;
  outlierVideoCount: number;
  medianSearchVolume: number;
  topMomentum: "hot" | "rising" | "steady";
};

type NicheHook = {
  videoId: string;
  channelTitle: string;
  videoTitle: string;
  hookText: string;
};

function formatVolume(n: number): string {
  if (n >= 1_000_000) {return `${(n / 1_000_000).toFixed(1)}M`;}
  if (n >= 1_000) {return `${Math.round(n / 1_000)}K`;}
  return String(n);
}

function avg(xs: number[]): number {
  return xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length;
}

function trendDeltaLabel(data: number[] | undefined): { label: string; tone: "up" | "down" | "flat" } {
  if (!data || data.length < 2) {return { label: "Stable", tone: "flat" };}
  const window = Math.min(3, Math.floor(data.length / 2));
  const recent = avg(data.slice(-window));
  const baseline = avg(data.slice(0, window));
  if (baseline === 0) {return recent > 0 ? { label: "New trend", tone: "up" } : { label: "Stable", tone: "flat" };}
  const pct = Math.round(((recent - baseline) / baseline) * 100);
  if (pct >= 10) {return { label: `Up ${pct}%`, tone: "up" };}
  if (pct <= -10) {return { label: `Down ${Math.abs(pct)}%`, tone: "down" };}
  return { label: "Steady", tone: "flat" };
}

function useNichePulse(niche: string | null): NichePulse | null {
  const [pulse, setPulse] = useState<NichePulse | null>(null);
  useEffect(() => {
    if (!niche) {
      setPulse(null);
      return;
    }
    let cancelled = false;
    const run = async () => {
      try {
        const res = await fetch(`/api/dashboard/niche-pulse?niche=${encodeURIComponent(niche)}`);
        const data = res.ok
          ? ((await res.json()) as { pulse: NichePulse | null })
          : { pulse: null };
        if (!cancelled) {setPulse(data.pulse ?? null);}
      } catch {
        if (!cancelled) {setPulse(null);}
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [niche]);
  return pulse;
}

function useNicheHooks(niche: string | null): { hooks: NicheHook[]; isLoading: boolean } {
  const [hooks, setHooks] = useState<NicheHook[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    if (!niche) {
      setHooks([]);
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    const run = async () => {
      try {
        const res = await fetch(`/api/dashboard/hooks?niche=${encodeURIComponent(niche)}`);
        const data = res.ok
          ? ((await res.json()) as { hooks: NicheHook[] })
          : { hooks: [] };
        if (!cancelled) {
          setHooks(Array.isArray(data.hooks) ? data.hooks : []);
          setIsLoading(false);
        }
      } catch {
        if (!cancelled) {
          setHooks([]);
          setIsLoading(false);
        }
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [niche]);
  return { hooks, isLoading };
}

/**
 * Public dashboard — "What to make this week" creator brief.
 * Niche → 3 enriched ideas anchored to real keyword data.
 */
export function DashboardPublicClient() {
  const { data: session } = useSession();
  const [state, setState] = useState<BriefState>(INITIAL_STATE);
  const [saved, setSaved] = useState<SavedIdea[]>([]);
  const [showAuth, setShowAuth] = useState(false);

  // Niche-aware modules — all three fetch in parallel keyed by state.niche.
  const trending = useNicheTrending(state.niche, 5);
  const pulse = useNichePulse(state.niche);
  const { hooks, isLoading: hooksLoading } = useNicheHooks(state.niche);

  // Hydrate saved ideas from localStorage (only meaningful for signed-in users
  // for now, but kept as device-local for the post-signup carry-over).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SAVED_IDEAS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SavedIdea[];
        if (Array.isArray(parsed)) {setSaved(parsed);}
      }
    } catch {
      // ignore
    }
  }, []);

  const savedTitles = useMemo(() => new Set(saved.map((s) => s.title)), [saved]);

  const persistSaved = useCallback((next: SavedIdea[]) => {
    setSaved(next);
    try {
      window.localStorage.setItem(SAVED_IDEAS_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, []);

  const fetchBrief = useCallback(async (niche: string) => {
    setState((prev) => ({ ...prev, niche, isLoading: true, error: null, limitReason: null }));
    try {
      const res = await fetch("/api/ideas/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche }),
      });

      if (res.status === 429) {
        const body = (await res.json().catch(() => null)) as
          | { error?: { details?: { reason?: LimitReason } } }
          | null;
        const reason = body?.error?.details?.reason ?? "signup_required";
        setState((prev) => ({
          ...prev,
          niche,
          isLoading: false,
          limitReason: reason,
        }));
        return;
      }

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as Record<string, unknown> | null;
        const message = (body?.message as string) ?? "Couldn't generate a brief right now. Try again.";
        setState((prev) => ({ ...prev, niche, isLoading: false, error: message }));
        return;
      }

      const data = (await res.json()) as BriefResponse;
      setState({ niche, isLoading: false, error: null, limitReason: null, data });
    } catch {
      setState((prev) => ({
        ...prev,
        niche,
        isLoading: false,
        error: "Something went wrong. Please try again.",
      }));
    }
  }, []);

  // Generate is open for everyone (server enforces tier limits).
  const handleNiche = useCallback((niche: string) => fetchBrief(niche), [fetchBrief]);

  // Refresh requires sign-in.
  const handleRefresh = useCallback(() => {
    if (!session) {
      setShowAuth(true);
      return;
    }
    if (state.niche) {void fetchBrief(state.niche);}
  }, [fetchBrief, session, state.niche]);

  // Save requires sign-in.
  const handleSaveToggle = useCallback(
    (idea: BriefIdea) => {
      if (!session) {
        setShowAuth(true);
        return;
      }
      const exists = savedTitles.has(idea.title);
      const next = exists
        ? saved.filter((it) => it.title !== idea.title)
        : [
            ...saved,
            {
              title: idea.title,
              hook: idea.hook,
              niche: state.niche ?? "",
              savedAt: new Date().toISOString(),
            },
          ];
      persistSaved(next);
    },
    [saved, savedTitles, persistSaved, session, state.niche],
  );

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        subtitle="What should you make next? Pick a niche and we'll build you a creator brief."
      />

      {/* Hero brief generator */}
      <section className={`${s.zoneSection} ${s.heroBand}`}>
        <div className={s.heroHeader}>
          <h2 className={s.heroTitle}>What to make this week</h2>
          <p className={s.heroSubtitle}>
            Three video ideas, anchored to real keyword data — refresh anytime.
          </p>
        </div>

        <div className={s.controlBlock}>
          <span className={s.controlLabel}>Niche</span>
          <div className={s.chipRow}>
            {NICHES.map((n) => (
              <button
                key={n}
                type="button"
                className={`${s.categoryChip} ${state.niche === n ? s.categoryChipActive : ""}`}
                onClick={() => handleNiche(n)}
                disabled={state.isLoading}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {state.isLoading && (
          <div className={s.publicLoading}>
            <div className={s.publicLoadingDots}>
              <span /><span /><span />
            </div>
            <p>Building your brief for {state.niche}…</p>
          </div>
        )}

        {!state.isLoading && state.data && state.data.ideas.length > 0 && (
          <>
            {pulse && state.niche && (
              <NichePulseLine niche={state.niche} pulse={pulse} />
            )}

            <div className={s.resultsActions}>
              <h3 className={s.resultsTitle}>
                Your brief for {state.niche}
              </h3>
              <button
                type="button"
                className={s.regenerateBtn}
                onClick={handleRefresh}
              >
                Refresh ideas
              </button>
            </div>

            <div className={s.briefGrid}>
              {state.data.ideas.map((idea, i) => (
                <BriefCard
                  key={`${state.niche}-${idea.title}-${i}`}
                  idea={idea}
                  anchor={state.data!.anchors[i] ?? null}
                  isSaved={savedTitles.has(idea.title)}
                  onSaveToggle={() => handleSaveToggle(idea)}
                />
              ))}
            </div>
          </>
        )}

        {!state.isLoading && state.error && (
          <div className={s.publicError}>
            <p>{state.error}</p>
            {state.niche && (
              <button
                type="button"
                className={s.publicBackBtn}
                onClick={() => handleNiche(state.niche!)}
              >
                Try again
              </button>
            )}
          </div>
        )}

        <RateLimitCard reason={state.limitReason} onSignupClick={() => setShowAuth(true)} />
      </section>

      {/* Trending in your niche */}
      {state.niche && (
        <NicheTrendingStrip
          niche={state.niche}
          videos={trending.videos}
          isLoading={trending.isLoading}
        />
      )}

      {/* Steal this hook */}
      {state.niche && (hooksLoading || hooks.length > 0) && (
        <NicheHooksPanel niche={state.niche} hooks={hooks} isLoading={hooksLoading} />
      )}

      <SavedIdeasSection saved={saved} onRemove={(title) => persistSaved(saved.filter((s2) => s2.title !== title))} />

      {/* Footer signup */}
      {!session && (
        <section className={s.footerSignupCard}>
          <p className={s.footerSignupTitle}>
            Want briefs tailored to your channel?
          </p>
          <p className={s.footerSignupBody}>
            Connect your YouTube channel for personalized ideas, competitor overlap,
            and growth insights.
          </p>
          <Link href="/auth/signup" className={s.publicSignupBtn}>
            Sign up free
          </Link>
          <span className={s.publicSignupSubtext}>Free forever. No credit card.</span>
        </section>
      )}

      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        onSuccess={() => setShowAuth(false)}
        title="Sign up for free"
        description="Create a free account to save ideas, refresh briefs, and unlock channel-tailored insights."
      />
    </PageContainer>
  );
}

/* ---------- Saved Ideas Section ---------- */

function SavedIdeasSection({
  saved,
  onRemove,
}: {
  saved: SavedIdea[];
  onRemove: (title: string) => void;
}) {
  if (saved.length === 0) {return null;}
  return (
    <section className={s.zoneSection}>
      <h3 className={s.sectionTitle}>Saved ideas ({saved.length})</h3>
      <ul className={s.savedList}>
        {saved.map((it) => (
          <li key={it.title} className={s.savedItem}>
            <div>
              <p className={s.savedTitle}>{it.title}</p>
              <p className={s.savedNiche}>{it.niche}</p>
            </div>
            <button
              type="button"
              className={s.savedRemoveBtn}
              onClick={() => onRemove(it.title)}
              aria-label={`Remove ${it.title}`}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------- Rate-limit Card ---------- */

function RateLimitCard({
  reason,
  onSignupClick,
}: {
  reason: LimitReason;
  onSignupClick: () => void;
}) {
  if (reason === "signup_required") {
    return (
      <div className={s.rateLimitCard}>
        <p className={s.rateLimitTitle}>You&apos;ve used today&apos;s free briefs.</p>
        <p className={s.rateLimitBody}>
          Sign up free to keep generating — and unlock briefs tailored to your channel.
        </p>
        <button type="button" className={s.publicSignupBtn} onClick={onSignupClick}>
          Sign up free
        </button>
      </div>
    );
  }
  if (reason === "upgrade_required") {
    return (
      <div className={s.rateLimitCard}>
        <p className={s.rateLimitTitle}>You&apos;ve hit the free-tier limit.</p>
        <p className={s.rateLimitBody}>
          Upgrade to PRO for unlimited briefs and channel-tailored ideas.
        </p>
        <Link href="/pricing" className={s.publicSignupBtn}>
          Upgrade to PRO
        </Link>
      </div>
    );
  }
  return null;
}

/* ---------- Niche Pulse ---------- */

function NichePulseLine({ niche, pulse }: { niche: string; pulse: NichePulse }) {
  const momentumWord =
    pulse.topMomentum === "hot"
      ? "hot"
      : pulse.topMomentum === "rising"
        ? "rising"
        : "steady";
  return (
    <p className={s.pulseLine}>
      <strong className={s.pulseHeader}>{niche} right now</strong>
      <span className={s.pulseSep}>·</span>
      <span>{pulse.gapCount} trending keywords</span>
      {pulse.outlierVideoCount > 0 && (
        <>
          <span className={s.pulseSep}>·</span>
          <span>{pulse.outlierVideoCount} outlier videos</span>
        </>
      )}
      <span className={s.pulseSep}>·</span>
      <span>median {formatVolume(pulse.medianSearchVolume)} mo searches</span>
      <span className={s.pulseSep}>·</span>
      <span>momentum {momentumWord}</span>
    </p>
  );
}

/* ---------- Niche Trending Strip ---------- */

function NicheTrendingStrip({
  niche,
  videos,
  isLoading,
}: {
  niche: string;
  videos: RisingVideo[];
  isLoading: boolean;
}) {
  return (
    <section className={s.zoneSection}>
      <h3 className={s.sectionTitle}>Trending in {niche} this week</h3>
      {isLoading ? (
        <div className={s.trendingStrip}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className={s.trendingTileSkeleton} />
          ))}
        </div>
      ) : videos.length === 0 ? (
        <p className={s.emptyNote}>
          No videos yet for {niche} — refreshing hourly.
        </p>
      ) : (
        <div className={s.trendingStrip}>
          {videos.map((v) => (
            <Link key={v.videoId} href={`/analyze/${v.videoId}`} className={s.trendingTile}>
              <div className={s.trendingThumb}>
                {v.thumbnailUrl && (
                  <Image
                    src={v.thumbnailUrl}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 40vw, 200px"
                    className={s.trendingThumbImg}
                  />
                )}
              </div>
              <p className={s.trendingTitle}>{v.title}</p>
              <p className={s.trendingChannel}>{v.channelName}</p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

/* ---------- Niche Hooks Panel ---------- */

function NicheHooksPanel({
  niche,
  hooks,
  isLoading,
}: {
  niche: string;
  hooks: NicheHook[];
  isLoading: boolean;
}) {
  return (
    <section className={s.zoneSection}>
      <h3 className={s.sectionTitle}>Hooks creators are using right now</h3>
      <p className={s.sectionSubtitle}>
        Pulled from the first 30 seconds of {niche} videos trending this week.
      </p>
      {isLoading ? (
        <ul className={s.hooksList}>
          {[0, 1, 2, 3, 4].map((i) => (
            <li key={i} className={s.hookSkeleton} />
          ))}
        </ul>
      ) : hooks.length === 0 ? (
        <p className={s.emptyNote}>
          No hooks ready for {niche} yet — refreshing every 24 hours.
        </p>
      ) : (
        <ul className={s.hooksList}>
          {hooks.map((h) => (
            <li key={h.videoId} className={s.hookItem}>
              <p className={s.hookText}>&ldquo;{h.hookText}&rdquo;</p>
              <Link href={`/analyze/${h.videoId}`} className={s.hookSource}>
                {h.channelTitle} — {h.videoTitle}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ---------- Brief Card subcomponents ---------- */

function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) {return null;}
  const max = Math.max(...data, 1);
  const w = 200;
  const h = 36;
  const points = data.map((v, i) => {
    const x = data.length === 1 ? 0 : (i / (data.length - 1)) * w;
    const y = h - (v / max) * h;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const area = `M0,${h} L${points.join(" L")} L${w},${h} Z`;
  const line = points.join(" ");
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className={s.sparkline}
      role="img"
      aria-label="Search interest trend over the last 12 months"
    >
      <path d={area} className={s.sparklineArea} />
      <polyline points={line} className={s.sparklineLine} />
    </svg>
  );
}

function WhyThisIdea({ anchor }: { anchor: BriefAnchor }) {
  const trend = trendDeltaLabel(anchor.trendData);
  const trendToneClass =
    trend.tone === "up" ? s.metricUp : trend.tone === "down" ? s.metricDown : s.metricFlat;
  return (
    <div className={s.whyBlock}>
      <div className={s.whyTopRow}>
        <span className={s.whyLabel}>Why this idea</span>
        <span className={s.whyKeyword}>&ldquo;{anchor.keyword}&rdquo;</span>
      </div>

      {anchor.trendData && anchor.trendData.length > 1 && (
        <Sparkline data={anchor.trendData} />
      )}

      <div className={s.whyMetrics}>
        <div className={s.metric}>
          <span className={s.metricLabel}>Trend</span>
          <span className={`${s.metricValue} ${trendToneClass}`}>{trend.label}</span>
        </div>
        <div className={s.metric}>
          <span className={s.metricLabel}>Audience</span>
          <span className={s.metricValue}>{formatVolume(anchor.searchVolume)}/mo</span>
        </div>
        {anchor.competitorVideo && (
          <div className={s.metric}>
            <span className={s.metricLabel}>Proof</span>
            <span className={s.metricValue}>{anchor.competitorVideo.channelTitle}</span>
          </div>
        )}
      </div>
    </div>
  );
}

type BriefCardProps = {
  idea: BriefIdea;
  anchor: BriefAnchor | null;
  isSaved: boolean;
  onSaveToggle: () => void;
};

function BriefCard({ idea, anchor, isSaved, onSaveToggle }: BriefCardProps) {
  const competitorVideoUrl = anchor?.competitorVideo
    ? `/analyze/${anchor.competitorVideo.videoId}`
    : null;

  return (
    <article className={s.briefCard}>
      <div className={s.briefCardHeader}>
        <h4 className={s.briefCardTitle}>{idea.title}</h4>
        <button
          type="button"
          className={`${s.savePin} ${isSaved ? s.savePinActive : ""}`}
          onClick={onSaveToggle}
          aria-label={isSaved ? "Remove from saved" : "Save for later"}
          title={isSaved ? "Saved — click to remove" : "Save for later"}
        >
          {isSaved ? "Saved" : "Save"}
        </button>
      </div>

      <p className={s.briefCardHook}>{idea.hook}</p>

      <p className={s.briefThumb}>
        <span className={s.briefThumbLabel}>Thumbnail concept</span>
        {idea.thumbnailConcept}
      </p>

      {anchor && <WhyThisIdea anchor={anchor} />}

      {competitorVideoUrl && (
        <div className={s.briefActions}>
          <Link href={competitorVideoUrl} className={s.briefActionSecondary}>
            See the winner →
          </Link>
        </div>
      )}
    </article>
  );
}
