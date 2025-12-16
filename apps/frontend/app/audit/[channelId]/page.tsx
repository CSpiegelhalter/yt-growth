"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type {
  Channel,
  Me,
  VideoWithRetention,
  SubscriberMagnetVideo,
  Plan,
} from "@/types/api";
import RetentionTable from "@/components/dashboard/RetentionTable";
import SubscriberMagnetTable from "@/components/dashboard/SubscriberMagnetTable";
import PlanCard from "@/components/dashboard/PlanCard";
import ErrorAlert from "@/components/dashboard/ErrorAlert";

type Tab = "retention" | "subscribers" | "plans";

export default function AuditPage() {
  const params = useParams();
  const channelId = params.channelId as string;

  const [me, setMe] = useState<Me | null>(null);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("retention");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data for each tab
  const [retentionVideos, setRetentionVideos] = useState<VideoWithRetention[]>([]);
  const [retentionLoading, setRetentionLoading] = useState(false);
  const [retentionFetched, setRetentionFetched] = useState(false);

  const [subscriberVideos, setSubscriberVideos] = useState<SubscriberMagnetVideo[]>([]);
  const [subscriberAnalysis, setSubscriberAnalysis] = useState<string | null>(null);
  const [subscriberLoading, setSubscriberLoading] = useState(false);
  const [subscriberFetched, setSubscriberFetched] = useState(false);

  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [plansFetched, setPlansFetched] = useState(false);
  const [latestPlan, setLatestPlan] = useState<Plan | null>(null);

  const isSubscribed = me?.subscription?.isActive ?? false;

  // Load initial data
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [meRes, channelRes] = await Promise.all([
          fetch("/api/me", { cache: "no-store" }),
          fetch(`/api/me/channels`, { cache: "no-store" }),
        ]);

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
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [channelId]);

  // Lazy load retention data
  const loadRetention = useCallback(async () => {
    if (retentionFetched || retentionLoading || !isSubscribed) return;

    setRetentionLoading(true);
    try {
      const res = await fetch(`/api/me/channels/${channelId}/retention`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to load retention");
      }
      const data = await res.json();
      setRetentionVideos(data.videos || []);
      setRetentionFetched(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load retention");
    } finally {
      setRetentionLoading(false);
    }
  }, [channelId, retentionFetched, retentionLoading, isSubscribed]);

  // Lazy load subscriber data
  const loadSubscribers = useCallback(async () => {
    if (subscriberFetched || subscriberLoading || !isSubscribed) return;

    setSubscriberLoading(true);
    try {
      const res = await fetch(`/api/me/channels/${channelId}/subscriber-audit`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to load subscriber audit");
      }
      const data = await res.json();
      setSubscriberVideos(data.topVideos || []);
      setSubscriberAnalysis(data.analysis);
      setSubscriberFetched(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load subscriber audit");
    } finally {
      setSubscriberLoading(false);
    }
  }, [channelId, subscriberFetched, subscriberLoading, isSubscribed]);

  // Lazy load plans
  const loadPlans = useCallback(async () => {
    if (plansFetched || plansLoading) return;

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
      setPlansFetched(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load plans");
    } finally {
      setPlansLoading(false);
    }
  }, [channelId, plansFetched, plansLoading]);

  // Load data when tab changes
  useEffect(() => {
    if (activeTab === "retention" && !retentionFetched) {
      loadRetention();
    } else if (activeTab === "subscribers" && !subscriberFetched) {
      loadSubscribers();
    } else if (activeTab === "plans" && !plansFetched) {
      loadPlans();
    }
  }, [
    activeTab,
    retentionFetched,
    subscriberFetched,
    plansFetched,
    loadRetention,
    loadSubscribers,
    loadPlans,
  ]);

  const generatePlan = async () => {
    setError(null);
    try {
      const res = await fetch(`/api/me/channels/${channelId}/plan/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate plan");
      }
      setLatestPlan(data.plan);
      setPlans([data.plan, ...plans]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to generate plan");
    }
  };

  if (loading) {
    return (
      <main style={{ padding: "24px" }}>
        <div style={{ textAlign: "center", color: "#64748b" }}>Loading...</div>
      </main>
    );
  }

  return (
    <main style={{ padding: "0", maxWidth: 1040, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Link
          href="/dashboard"
          style={{
            fontSize: "0.875rem",
            color: "#64748b",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            marginBottom: 8,
          }}
        >
          ← Back to Dashboard
        </Link>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: 0 }}>
          Channel Audit
        </h1>
        {channel && (
          <p style={{ color: "#64748b", marginTop: 4 }}>{channel.title}</p>
        )}
      </div>

      {error && <ErrorAlert message={error} />}

      {/* Subscription gate */}
      {!isSubscribed && (
        <div
          style={{
            background: "#fffbeb",
            border: "1px solid #fde68a",
            padding: 16,
            borderRadius: 10,
            marginBottom: 24,
          }}
        >
          <p style={{ margin: 0, marginBottom: 8 }}>
            🔒 Upgrade to Pro to access full audit features
          </p>
          <a
            href="/api/integrations/stripe/checkout"
            style={{
              display: "inline-block",
              padding: "8px 16px",
              background: "#2563eb",
              color: "white",
              borderRadius: 8,
              textDecoration: "none",
              fontSize: "0.875rem",
              fontWeight: 500,
            }}
          >
            Subscribe Now
          </a>
        </div>
      )}

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 4,
          borderBottom: "1px solid #e2e8f0",
          marginBottom: 24,
          overflowX: "auto",
        }}
      >
        {[
          { id: "retention" as Tab, label: "📉 Retention Cliffs" },
          { id: "subscribers" as Tab, label: "🧲 Subscriber Magnets" },
          { id: "plans" as Tab, label: "📋 Plans" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "8px 16px",
              fontSize: "0.875rem",
              fontWeight: 500,
              color: activeTab === tab.id ? "#2563eb" : "#64748b",
              background: "none",
              border: "none",
              borderBottom:
                activeTab === tab.id ? "2px solid #2563eb" : "2px solid transparent",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "retention" && (
        <RetentionTable
          videos={retentionVideos}
          loading={retentionLoading}
        />
      )}

      {activeTab === "subscribers" && (
        <SubscriberMagnetTable
          videos={subscriberVideos}
          analysis={subscriberAnalysis}
          loading={subscriberLoading}
        />
      )}

      {activeTab === "plans" && (
        <div>
          <PlanCard
            plan={latestPlan}
            channelId={channelId}
            isSubscribed={isSubscribed}
            onGenerate={generatePlan}
            loading={plansLoading}
          />

          {plans.length > 1 && (
            <div style={{ marginTop: 24 }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 16 }}>
                Plan History
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {plans.slice(1).map((plan) => (
                  <div
                    key={plan.id}
                    style={{
                      padding: 12,
                      background: "#f8fafc",
                      borderRadius: 8,
                      fontSize: "0.875rem",
                    }}
                  >
                    <span style={{ fontWeight: 500 }}>
                      Plan #{plan.id}
                    </span>
                    <span style={{ color: "#64748b", marginLeft: 8 }}>
                      {new Date(plan.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
