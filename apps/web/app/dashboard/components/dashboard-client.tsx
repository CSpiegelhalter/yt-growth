"use client";

import { useRouter } from "next/navigation";

import { OverviewPanel } from "@/components/overview";
import { PricingModal } from "@/components/pricing/PricingModal";
import { PageContainer } from "@/components/ui";
import type { Channel } from "@/types/api";

import s from "./dashboard-client.module.css";
import { ProfileCompletionPopup } from "./profile-completion-popup";
import { SourceDrawer } from "./source-drawer";
import { SuggestionPanel } from "./suggestion-panel";
import { useSuggestionEngine } from "./use-suggestion-engine";

type DashboardClientProps = {
  initialChannels: Channel[];
  initialActiveChannelId: string | null;
  isPro: boolean;
};

export function DashboardClient({
  initialChannels,
  initialActiveChannelId,
  isPro,
}: DashboardClientProps) {
  const activeChannel = initialChannels.find(
    (c) => c.channel_id === initialActiveChannelId,
  );

  const router = useRouter();

  const engine = useSuggestionEngine({
    channelId: activeChannel?.id ? String(activeChannel.id) : null,
    youtubeChannelId: activeChannel?.channel_id ?? null,
    isPro,
  });

  const drawerSuggestion = engine.drawerSuggestionId
    ? engine.suggestions.find((s) => s.id === engine.drawerSuggestionId) ?? null
    : null;

  function handleMakeMyVersion(suggestionId: string) {
    engine.closeDrawer();
    void engine.handleAction(suggestionId, "use");
  }

  function handleAnalyzeSource(videoId: string) {
    engine.closeDrawer();
    router.push(`/competitors/video/${videoId}`);
  }

  return (
    <PageContainer>
      {initialActiveChannelId && (
        <ProfileCompletionPopup channelId={initialActiveChannelId} />
      )}
      <div className={s.grid}>
        <div className={`${s.leftPanel} ${s.panelCard}`}>
          <h2 className={s.panelTitle}>Performance Overview</h2>
          <OverviewPanel channelId={initialActiveChannelId!} />
        </div>
        <div className={`${s.rightPanel} ${s.panelCard}`}>
          <SuggestionPanel
            suggestions={engine.suggestions}
            loading={engine.loading}
            error={engine.error}
            onAction={engine.handleAction}
            onRetry={engine.handleRetry}
            onGenerate={engine.handleGenerate}
            researchPhase={engine.researchPhase}
            researchStatus={engine.researchStatus}
            researchError={engine.researchError}
            channelId={activeChannel?.id ? String(activeChannel.id) : null}
            youtubeChannelId={activeChannel?.channel_id ?? null}
            isPro={isPro}
            onViewSource={engine.openDrawer}
            needsDiscovery={engine.needsDiscovery}
            onDiscoveryComplete={engine.onDiscoveryComplete}
          />
        </div>
      </div>
      <SourceDrawer
        suggestion={drawerSuggestion}
        isOpen={engine.isDrawerOpen}
        onClose={engine.closeDrawer}
        onMakeMyVersion={handleMakeMyVersion}
        onAnalyzeSource={handleAnalyzeSource}
      />
      <PricingModal isOpen={engine.showPricing} onClose={() => engine.setShowPricing(false)} />
    </PageContainer>
  );
}
