"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import styles from "./style.module.css";
import RetentionTable from "@/components/dashboard/RetentionTable";
import SubscriberMagnetTable from "@/components/dashboard/SubscriberMagnetTable";
import PlanCard from "@/components/dashboard/PlanCard";
import ErrorAlert from "@/components/dashboard/ErrorAlert";
import BillingCTA from "@/components/dashboard/BillingCTA";
import { Plan, RetentionRow, SubscriberMagnetRow } from "@/types/api";

export default function AuditPage({ params }: { params: { channelId: string } }) {
  const channelId = params.channelId;
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<string>(searchParams.get("tab") ?? "retention");
  const [retention, setRetention] = useState<RetentionRow[]>([]);
  const [hypothesis, setHypothesis] = useState<string>("");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subs, setSubs] = useState<SubscriberMagnetRow[]>([]);
  const [subsSummary, setSubsSummary] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const loadRetention = async (force = false) => {
    const r = await fetch(
      `/api/me/channels/${channelId}/retention${force ? "?force=1" : ""}`,
      { cache: "no-store" }
    );
    if (r.status === 402) throw new Error("Subscription required for retention");
    if (!r.ok) throw new Error("Failed to load retention");
    const body = await r.json();
    setRetention(body.items ?? []);
    setHypothesis(body.hypothesis ?? "");
  };

  const loadPlans = async () => {
    const r = await fetch(`/api/me/channels/${channelId}/plans`, { cache: "no-store" });
    if (r.status === 402) throw new Error("Subscription required for plans");
    if (!r.ok) throw new Error("Failed to load plans");
    const body = await r.json();
    setPlans(body.plans ?? []);
  };

  const loadSubs = async () => {
    const r = await fetch(`/api/me/channels/${channelId}/subscriber-audit`, { cache: "no-store" });
    if (r.status === 402) throw new Error("Subscription required for subscriber audit");
    if (!r.ok) throw new Error("Failed to load subscriber audit");
    const body = await r.json();
    setSubs(body.items ?? []);
    setSubsSummary(body.summary ?? "");
  };

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      await Promise.all([loadRetention(), loadPlans(), loadSubs()]);
    } catch (e: any) {
      setErr(e.message || "Failed to load audit");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [channelId]);

  useEffect(() => {
    setTab(searchParams.get("tab") ?? "retention");
  }, [searchParams]);

  const refreshRetention = async () => {
    setBusy("retention");
    try {
      await loadRetention(true);
    } catch (e: any) {
      setErr(e.message || "Failed to refresh retention");
    } finally {
      setBusy(null);
    }
  };

  const regeneratePlan = async () => {
    setBusy("plan");
    setErr(null);
    try {
      const r = await fetch(`/api/me/channels/${channelId}/plan/generate`, { method: "POST" });
      if (r.status === 402) throw new Error("Subscription required for plans");
      if (!r.ok) throw new Error("Failed to generate plan");
      await loadPlans();
    } catch (e: any) {
      setErr(e.message || "Failed to generate plan");
    } finally {
      setBusy(null);
    }
  };

  const startCheckout = async () => {
    setBusy("billing");
    setErr(null);
    try {
      const r = await fetch("/api/integrations/stripe/checkout", { method: "POST" });
      if (!r.ok) throw new Error("Failed to start checkout");
      const { url } = await r.json();
      window.location.href = url;
    } catch (e: any) {
      setErr(e.message || "Unable to start checkout");
    } finally {
      setBusy(null);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.h1}>Audit</h1>
          <p className={styles.subtle}>Retention cliffs, plans, and subscriber magnets.</p>
        </div>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === "retention" ? styles.tabActive : ""}`}
            onClick={() => {
              setTab("retention");
              window.history.replaceState(null, "", `?tab=retention`);
            }}
          >
            Retention
          </button>
          <button
            className={`${styles.tab} ${tab === "plan" ? styles.tabActive : ""}`}
            onClick={() => {
              setTab("plan");
              window.history.replaceState(null, "", `?tab=plan`);
            }}
          >
            Decide-for-Me
          </button>
          <button
            className={`${styles.tab} ${tab === "subscribers" ? styles.tabActive : ""}`}
            onClick={() => {
              setTab("subscribers");
              window.history.replaceState(null, "", `?tab=subscribers`);
            }}
          >
            Subscriber magnets
          </button>
        </div>
      </div>

      {err && <ErrorAlert message={err} />}

      {!loading && err?.toLowerCase().includes("subscription") && (
        <BillingCTA status="inactive" onSubscribe={startCheckout} busy={busy === "billing"} text={err} />
      )}

      {!loading && tab === "retention" && (
        <RetentionTable
          rows={retention}
          hypothesis={hypothesis}
          onRefresh={refreshRetention}
          busy={busy === "retention"}
        />
      )}

      {!loading && tab === "plan" && (
        <>
          {plans[0] ? (
            <PlanCard plan={plans[0]} onRegenerate={regeneratePlan} busy={busy === "plan"} />
          ) : (
            <BillingCTA
              status="inactive"
              onSubscribe={startCheckout}
              busy={busy === "billing"}
              text="Generate your first Decide-for-Me plan to see topics, titles, and tags."
            />
          )}
        </>
      )}

      {!loading && tab === "subscribers" && (
        <SubscriberMagnetTable rows={subs} summary={subsSummary} />
      )}
    </main>
  );
}