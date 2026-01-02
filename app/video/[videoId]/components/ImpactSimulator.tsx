"use client";

import s from "../style.module.css";
import type { DerivedMetrics, ChannelBaseline } from "@/types/api";

type ImpactSimulatorProps = {
  derived: DerivedMetrics;
  baseline: ChannelBaseline;
};

/**
 * ImpactSimulator - Simple what-if projections
 * Shows estimated impact of improving CTR/retention to channel median
 * Honest, conservative estimates with clear caveats
 */
export function ImpactSimulator({ derived, baseline }: ImpactSimulatorProps) {
  // Only show if we have enough data
  if (!derived.impressions && !derived.avgViewPercentage) {
    return null;
  }

  const simulations: Array<{
    title: string;
    current: string;
    target: string;
    impact: string;
    caveat: string;
  }> = [];

  // CTR simulation (if we have impressions)
  if (
    derived.impressions != null &&
    derived.impressionsCtr != null &&
    baseline.impressionsCtr?.median != null &&
    derived.impressionsCtr < baseline.impressionsCtr.median
  ) {
    const currentCtr = derived.impressionsCtr;
    const targetCtr = baseline.impressionsCtr.median;
    const currentViews = derived.totalViews;
    const estimatedViews = Math.round(
      (derived.impressions * targetCtr) / 100
    );
    const viewsGain = estimatedViews - currentViews;

    if (viewsGain > 0) {
      simulations.push({
        title: "If CTR improved to your median",
        current: `${currentCtr.toFixed(1)}%`,
        target: `${targetCtr.toFixed(1)}%`,
        impact: `+${viewsGain.toLocaleString()} estimated views`,
        caveat: "at current impression count",
      });
    }
  }

  // Retention simulation
  const currentAvd =
    derived.avgViewPercentage ?? (derived.avdRatio != null ? derived.avdRatio * 100 : null);
  const baselineAvd = baseline.avgViewPercentage?.median
    ? baseline.avgViewPercentage.median * 100
    : null;

  if (
    currentAvd != null &&
    baselineAvd != null &&
    currentAvd < baselineAvd * 0.9 // More than 10% below median
  ) {
    simulations.push({
      title: "If retention improved to your median",
      current: `${currentAvd.toFixed(0)}%`,
      target: `${baselineAvd.toFixed(0)}%`,
      impact:
        "YouTube more likely to expand distribution; track impressions over next 48h",
      caveat: "Retention is a key signal for the algorithm",
    });
  }

  // Subscriber conversion simulation
  if (
    derived.subsPer1k != null &&
    baseline.subsPer1k?.median != null &&
    derived.subsPer1k < baseline.subsPer1k.median
  ) {
    const currentSubs = derived.subsPer1k;
    const targetSubs = baseline.subsPer1k.median;
    const currentNetSubs = Math.round(
      (derived.totalViews / 1000) * currentSubs
    );
    const estimatedNetSubs = Math.round(
      (derived.totalViews / 1000) * targetSubs
    );
    const subsGain = estimatedNetSubs - currentNetSubs;

    if (subsGain > 0) {
      simulations.push({
        title: "If subs/1K improved to your median",
        current: `${currentSubs.toFixed(1)}/1K`,
        target: `${targetSubs.toFixed(1)}/1K`,
        impact: `+${subsGain} more subscribers`,
        caveat: "at current view count",
      });
    }
  }

  if (simulations.length === 0) {
    return null;
  }

  return (
    <section className={s.impactSimulator}>
      <h2 className={s.sectionTitle}>Impact Simulator</h2>
      <p className={s.sectionDesc}>
        What if you improved to your channel median?
      </p>

      <div className={s.simulationGrid}>
        {simulations.map((sim, i) => (
          <div key={i} className={s.simulationCard}>
            <h4 className={s.simulationTitle}>{sim.title}</h4>
            <div className={s.simulationMetrics}>
              <div className={s.simulationMetric}>
                <span className={s.simulationLabel}>Current</span>
                <span className={s.simulationValue}>{sim.current}</span>
              </div>
              <span className={s.simulationArrow}>→</span>
              <div className={s.simulationMetric}>
                <span className={s.simulationLabel}>Target</span>
                <span className={s.simulationValueTarget}>{sim.target}</span>
              </div>
            </div>
            <div className={s.simulationImpact}>
              <span className={s.simulationImpactValue}>{sim.impact}</span>
              <span className={s.simulationCaveat}>{sim.caveat}</span>
            </div>
          </div>
        ))}
      </div>

      <p className={s.simulatorDisclaimer}>
        These are estimates based on your channel averages, not guarantees.
      </p>
    </section>
  );
}
