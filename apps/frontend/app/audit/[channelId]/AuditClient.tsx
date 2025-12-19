"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type {
  Channel,
  Me,
  SubscriberMagnetVideo,
  Plan,
  SimilarChannelsResponse,
  PatternAnalysisJson,
} from "@/types/api";
import { useRetention } from "@/lib/use-retention";
import RetentionTable from "@/components/dashboard/RetentionTable";
import SubscriberMagnetTable from "@/components/dashboard/SubscriberMagnetTable";
import PlanCard from "@/components/dashboard/PlanCard";
import SimilarChannelsSection from "@/components/dashboard/SimilarChannels";
import ErrorAlert from "@/components/dashboard/ErrorAlert";
import s from "./style.module.css";

type Tab = "retention" | "subscribers" | "similar" | "plans";

/**
 * AuditClient - Interactive client component for channel audit
 */
export default function AuditClient() {
  const params = useParams();
  const channelId = params.channelId as string;

  const [me, setMe] = useState<Me | null>(null);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("retention");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isSubscribed = me?.subscription?.isActive ?? false;

  // Use the retention hook with proper deduping
  const retention = useRetention(channelId, {
    fetchOnMount: activeTab === "retention",
    isSubscribed,
  });

  // Subscriber audit state with ref-based deduping
  const [subscriberVideos, setSubscriberVideos] = useState<SubscriberMagnetVideo[]>([]);
  const [subscriberAnalysis, setSubscriberAnalysis] = useState<{
    analysisJson: PatternAnalysisJson | null;
    analysisMarkdownFallback: string | null;
  } | null>(null);
  const [subscriberLoading, setSubscriberLoading] = useState(false);
  const [subscriberLastUpdated, setSubscriberLastUpdated] = useState<string | null>(null);
  const [subscriberIsDemo, setSubscriberIsDemo] = useState(false);
  const subscriberFetchedRef = useRef(false);
  const subscriberInFlightRef = useRef(false);

  // Similar channels state
  const [similarChannels, setSimilarChannels] = useState<SimilarChannelsResponse | null>(null);
  const [similarLoading, setSimilarLoading] = useState(false);
  const [similarIsDemo, setSimilarIsDemo] = useState(false);
  const similarFetchedRef = useRef(false);
  const similarInFlightRef = useRef(false);

  // Plans state with ref-based deduping
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [latestPlan, setLatestPlan] = useState<Plan | null>(null);
  const plansFetchedRef = useRef(false);
  const plansInFlightRef = useRef(false);

  // Load initial data (me + channel)
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const [meRes, channelRes] = await Promise.all([
          fetch("/api/me", { cache: "no-store" }),
          fetch(`/api/me/channels`, { cache: "no-store" }),
        ]);

        if (cancelled) return;

        if (!meRes.ok) throw new Error("Failed to load user");
        const meData = await meRes.json();
        setMe(meData);

        if (channelRes.ok) {
          const channels = await channelRes.json();
          const ch = channels.find(
            (c: Channel) => c.channel_id === channelId
          );
          setChannel(ch || null);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load data");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    load();

    return () => {
      cancelled = true;
    };
  }, [channelId]);

  // Load subscriber audit data
  const loadSubscribers = useCallback(async (params?: { range?: "7d" | "28d"; sort?: string }) => {
    if (subscriberInFlightRef.current || (!params && subscriberFetchedRef.current) || !isSubscribed) {
      return;
    }

    subscriberInFlightRef.current = true;
    setSubscriberLoading(true);

    try {
      const queryParams = new URLSearchParams();
      if (params?.range) queryParams.set("range", params.range);
      if (params?.sort) queryParams.set("sort", params.sort);
      
      const url = `/api/me/channels/${channelId}/subscriber-audit${queryParams.toString() ? `?${queryParams}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to load subscriber audit");
      }
      const data = await res.json();
      setSubscriberVideos(data.videos || []);
      setSubscriberAnalysis(data.patternAnalysis || null);
      setSubscriberLastUpdated(data.generatedAt || null);
      setSubscriberIsDemo(Boolean(data.demo));
      subscriberFetchedRef.current = true;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load subscriber audit");
    } finally {
      subscriberInFlightRef.current = false;
      setSubscriberLoading(false);
    }
  }, [channelId, isSubscribed]);

  // Load similar channels data
  const loadSimilarChannels = useCallback(async (range?: "7d" | "14d") => {
    if (similarInFlightRef.current || (!range && similarFetchedRef.current) || !isSubscribed) {
      return;
    }

    similarInFlightRef.current = true;
    setSimilarLoading(true);

    try {
      const url = `/api/me/channels/${channelId}/similar${range ? `?range=${range}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to load similar channels");
      }
      const data = await res.json();
      setSimilarChannels(data);
      setSimilarIsDemo(Boolean(data.demo));
      similarFetchedRef.current = true;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load similar channels");
    } finally {
      similarInFlightRef.current = false;
      setSimilarLoading(false);
    }
  }, [channelId, isSubscribed]);

  // Load plans data
  const loadPlans = useCallback(async () => {
    if (plansInFlightRef.current || plansFetchedRef.current) {
      return;
    }

    plansInFlightRef.current = true;
    setPlansLoading(true);

    try {
      const res = await fetch(`/api/me/channels/${channelId}/plans?limit=10`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to load plans");
      }
      const data = await res.json();
      setPlans(data.plans || []);
      if (data.plans && data.plans.length > 0) {
        setLatestPlan(data.plans[0]);
      }
      plansFetchedRef.current = true;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load plans");
    } finally {
      plansInFlightRef.current = false;
      setPlansLoading(false);
    }
  }, [channelId]);

  // Load data when tab changes (only once per tab)
  useEffect(() => {
    if (activeTab === "subscribers" && !subscriberFetchedRef.current) {
      loadSubscribers();
    } else if (activeTab === "similar" && !similarFetchedRef.current) {
      loadSimilarChannels();
    } else if (activeTab === "plans" && !plansFetchedRef.current) {
      loadPlans();
    }
    // Note: retention is handled by useRetention hook automatically
  }, [activeTab, loadSubscribers, loadSimilarChannels, loadPlans]);

  const generatePlan = async (options?: { mode?: "default" | "more" }) => {
    setError(null);
    try {
      const res = await fetch(`/api/me/channels/${channelId}/plan/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: options?.mode ?? "default" }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate plan");
      }
      setLatestPlan(data.plan);
      if (!options?.mode || options.mode === "default") {
        setPlans([data.plan, ...plans]);
      } else {
        // Update existing plan in list
        setPlans(plans.map((p) => (p.id === data.plan.id ? data.plan : p)));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to generate plan");
    }
  };

  // Combine errors from retention hook
  const displayError = error || retention.error;

  if (loading) {
    return (
      <main className={s.main}>
        <div className={s.loadingState}>Loading...</div>
      </main>
    );
  }

  return (
    <main className={s.main}>
      {/* Header */}
      <div className={s.headerSection}>
        <Link href="/dashboard" className={s.backLink}>
          ← Back to Dashboard
        </Link>
        <h1 className={s.pageTitle}>Channel Audit</h1>
        {channel && <p className={s.channelName}>{channel.title}</p>}
      </div>

      {displayError && <ErrorAlert message={displayError} />}

      {/* Subscription gate */}
      {!isSubscribed && (
        <div className={s.subscriptionBanner}>
          <p className={s.bannerText}>
            Upgrade to Pro to access full audit features
          </p>
          <a href="/api/integrations/stripe/checkout" className={s.bannerBtn}>
            Subscribe Now
          </a>
        </div>
      )}

      {/* Tabs */}
      <div className={s.tabsContainer}>
        {[
          { id: "retention" as Tab, label: "Drop-offs" },
          { id: "subscribers" as Tab, label: "Subscriber Drivers" },
          { id: "similar" as Tab, label: "Similar Channels" },
          { id: "plans" as Tab, label: "Ideas" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`${s.tab} ${activeTab === tab.id ? s.tabActive : ""}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className={s.tabContent}>
        {activeTab === "retention" && (
          <div>
            <RetentionTable
              videos={retention.videos}
              loading={retention.loading}
              isDemo={retention.isDemo}
            />
            {retention.isStale && isSubscribed && (
              <button onClick={() => retention.refresh()} className={s.refreshBtn}>
                Refresh Data
              </button>
            )}
          </div>
        )}

        {activeTab === "subscribers" && (
          <SubscriberMagnetTable
            videos={subscriberVideos}
            patternAnalysis={subscriberAnalysis}
            loading={subscriberLoading}
            onRefresh={(params) => loadSubscribers(params)}
            lastUpdated={subscriberLastUpdated}
            isSubscribed={isSubscribed}
            isDemo={subscriberIsDemo}
          />
        )}

        {activeTab === "similar" && (
          <SimilarChannelsSection
            data={similarChannels}
            loading={similarLoading}
            onRefresh={(range) => loadSimilarChannels(range)}
            isSubscribed={isSubscribed}
            isDemo={similarIsDemo}
          />
        )}

        {activeTab === "plans" && (
          <div>
            <PlanCard
              plan={latestPlan}
              channelId={channelId}
              channelName={channel?.title ?? undefined}
              isSubscribed={isSubscribed}
              onGenerate={generatePlan}
              loading={plansLoading}
            />

            {plans.length > 1 && (
              <div className={s.planHistory}>
                <h3 className={s.historyTitle}>Plan History</h3>
                <div className={s.historyList}>
                  {plans.slice(1).map((plan) => (
                    <button
                      key={plan.id}
                      className={s.historyItem}
                      onClick={() => setLatestPlan(plan)}
                    >
                      <span className={s.historyLabel}>Plan #{plan.id}</span>
                      <span className={s.historyDate}>
                        {new Date(plan.createdAt).toLocaleDateString()}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

