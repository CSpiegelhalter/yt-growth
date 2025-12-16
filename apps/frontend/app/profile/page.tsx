"use client";

import { useEffect, useState } from "react";
import type { Me, Channel } from "@/types/api";
import AccountStats from "@/components/dashboard/AccountStats";
import BillingCTA from "@/components/dashboard/BillingCTA";
import ErrorAlert from "@/components/dashboard/ErrorAlert";

export default function ProfilePage() {
  const [me, setMe] = useState<Me | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setErr(null);
      try {
        const [mRes, cRes] = await Promise.all([
          fetch("/api/me", { cache: "no-store" }),
          fetch("/api/me/channels", { cache: "no-store" }),
        ]);
        if (!mRes.ok) throw new Error("Failed to load /api/me");
        if (!cRes.ok) throw new Error("Failed to load /api/me/channels");
        const [m, c] = await Promise.all([mRes.json(), cRes.json()]);
        setMe(m);
        setChannels(c);
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const isSubscribed = me?.subscription?.isActive ?? false;

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "0" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: 0 }}>
          Profile
        </h1>
        <p style={{ color: "#64748b", marginTop: 4, fontSize: "0.875rem" }}>
          Manage your account and subscription
        </p>
      </div>

      {err && <ErrorAlert message={err} />}

      {loading ? (
        <div
          style={{
            background: "#f8fafc",
            padding: 24,
            borderRadius: 16,
            textAlign: "center",
            color: "#64748b",
          }}
        >
          Loading...
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Account Info */}
          <section
            style={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 16,
              padding: 24,
            }}
          >
            <h2 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: 16 }}>
              Account Information
            </h2>
            <AccountStats me={me} channelCount={channels.length} />
          </section>

          {/* Subscription */}
          <section>
            <h2
              style={{
                fontSize: "1.125rem",
                fontWeight: 600,
                marginBottom: 16,
              }}
            >
              Subscription
            </h2>
            <BillingCTA
              isSubscribed={isSubscribed}
              plan={me?.plan ?? "free"}
              status={me?.status ?? "inactive"}
              currentPeriodEnd={me?.subscription?.currentPeriodEnd ?? null}
            />
          </section>

          {/* Connected Channels */}
          <section
            style={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 16,
              padding: 24,
            }}
          >
            <h2 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: 16 }}>
              Connected Channels
            </h2>
            {channels.length === 0 ? (
              <p style={{ color: "#64748b", fontSize: "0.875rem" }}>
                No channels connected yet.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {channels.map((ch) => (
                  <div
                    key={ch.channel_id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: 12,
                      background: "#f8fafc",
                      borderRadius: 10,
                    }}
                  >
                    {ch.thumbnailUrl && (
                      <img
                        src={ch.thumbnailUrl}
                        alt=""
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: "50%",
                          objectFit: "cover",
                        }}
                      />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 500,
                          fontSize: "0.875rem",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {ch.title ?? "Untitled Channel"}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                        {ch.videoCount ?? 0} videos • {ch.planCount ?? 0} plans
                      </div>
                    </div>
                    <span
                      style={{
                        padding: "2px 8px",
                        fontSize: "0.75rem",
                        fontWeight: 500,
                        borderRadius: 9999,
                        background:
                          ch.syncStatus === "idle" ? "#d1fae5" : "#fef3c7",
                        color:
                          ch.syncStatus === "idle" ? "#065f46" : "#92400e",
                      }}
                    >
                      {ch.syncStatus}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Danger Zone */}
          <section
            style={{
              background: "#fff",
              border: "1px solid #fecaca",
              borderRadius: 16,
              padding: 24,
            }}
          >
            <h2
              style={{
                fontSize: "1.125rem",
                fontWeight: 600,
                marginBottom: 8,
                color: "#991b1b",
              }}
            >
              Danger Zone
            </h2>
            <p
              style={{
                color: "#64748b",
                fontSize: "0.875rem",
                marginBottom: 16,
              }}
            >
              These actions are irreversible. Please be certain.
            </p>
            <button
              style={{
                padding: "8px 16px",
                fontSize: "0.875rem",
                fontWeight: 500,
                color: "#dc2626",
                background: "none",
                border: "1px solid #dc2626",
                borderRadius: 8,
                cursor: "pointer",
              }}
              onClick={() => alert("Account deletion would be handled here")}
            >
              Delete Account
            </button>
          </section>
        </div>
      )}
    </main>
  );
}
