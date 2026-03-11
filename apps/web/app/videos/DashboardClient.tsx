"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import ChannelsSection from "@/components/dashboard/ChannelSection";
import ErrorAlert from "@/components/dashboard/ErrorAlert";
import { PageContainer } from "@/components/ui";
import { useSyncActiveChannel } from "@/lib/use-sync-active-channel";
import { enhanceVideosWithMetrics, sortVideos } from "@/lib/video-tools";
import type { Channel, Me } from "@/types/api";

import { PlannedLeftContent, PlannedRightContent } from "./components/PlannedTabContent";
import { SplitPanel } from "./components/SplitPanel";
import { SubscribeCta } from "./components/SubscribeCta";
import { SuccessAlert } from "./components/SuccessAlert";
import type { VideoTab } from "./components/TabToggle";
import {
  connectChannel,
  toDashboardVideo,
} from "./dashboard-helpers";
import s from "./style.module.css";
import { useChannelActions } from "./useChannelActions";
import {
  useChannelRemovedListener,
  useCheckoutStatus,
  useOAuthReturnRedirect,
  useVideoLoader,
  useVisibilityRefresh,
} from "./useDashboardData";
import { usePlannedTab } from "./usePlannedTab";

type Props = {
  initialMe: Me;
  initialChannels: Channel[];
  initialActiveChannelId: string | null;
  checkoutStatus?: string;
};

export function DashboardClient({
  initialMe,
  initialChannels,
  initialActiveChannelId,
  checkoutStatus,
}: Props) {
  const searchParams = useSearchParams();
  const urlChannelId = searchParams.get("channelId");

  const [me, setMe] = useState<Me>(initialMe);
  const [channels, setChannels] = useState<Channel[]>(initialChannels);

  const { activeChannelId, setActiveChannelId } = useSyncActiveChannel({
    channels,
    initialActiveChannelId,
    urlChannelId,
  });

  useEffect(() => { setMe(initialMe); }, [initialMe]);
  useEffect(() => { setChannels(initialChannels); }, [initialChannels]);
  useOAuthReturnRedirect(searchParams);

  const { videos, videosLoading, loadVideos } = useVideoLoader();

  const urlTab = searchParams.get("tab");
  const urlIdeaId = searchParams.get("ideaId");

  const [tab, setTab] = useState<VideoTab>(urlTab === "planned" ? "planned" : "published");
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const planned = usePlannedTab(activeChannelId);

  const activeChannel = channels.find((c) => c.channel_id === activeChannelId) ?? null;
  const isSubscribed = me.subscription?.isActive ?? false;

  const videosWithMetrics = useMemo(
    () => sortVideos(enhanceVideosWithMetrics(videos.map(toDashboardVideo)), "newest"),
    [videos],
  );

  useEffect(() => {
    if (selectedVideoId === null && videosWithMetrics.length > 0) {
      setSelectedVideoId(videosWithMetrics[0].videoId);
    }
  }, [videosWithMetrics, selectedVideoId]);

  useCheckoutStatus(checkoutStatus, setSuccess, setErr);
  useChannelRemovedListener(setChannels);
  useVisibilityRefresh(setChannels);

  useEffect(() => {
    if (activeChannelId) {void loadVideos(activeChannelId);}
  }, [activeChannelId, loadVideos]);

  const { unlink, refreshChannel } = useChannelActions({
    setMe, setChannels, setErr, setSuccess, setBusy,
    activeChannelId, channels, setActiveChannelId, loadVideos,
  });

  const selectedVideo = selectedVideoId
    ? videosWithMetrics.find((v) => v.videoId === selectedVideoId) ?? null
    : null;

  function handleSelect(id: string) {
    setSelectedVideoId(id);
    setShowDetail(true);
  }

  function handleNewIdea() {
    planned.handleNewIdea();
    setShowDetail(true);
  }

  function handleSelectIdea(id: string) {
    planned.handleSelectIdea(id);
    setShowDetail(true);
  }

  // Auto-select idea from URL param after ideas finish loading
  const autoSelectDone = useRef(false);

  useEffect(() => {
    if (autoSelectDone.current || !urlIdeaId || planned.ideasLoading) {
      return;
    }
    const match = planned.ideas.find((i) => i.id === urlIdeaId);
    if (match) {
      planned.handleSelectIdea(urlIdeaId);
      setShowDetail(true);
      autoSelectDone.current = true;
    }
  }, [urlIdeaId, planned, setShowDetail]);

  function handleBack() {
    setShowDetail(false);
    if (tab === "planned") {planned.handleDiscard();}
  }

  const showChannels = channels.length === 0 || !activeChannel;
  const showSplitPanel = activeChannel && activeChannelId;

  return (
    <PageContainer>
      {success && <SuccessAlert message={success} onDismiss={() => setSuccess(null)} />}
      {err && <ErrorAlert message={err} />}

      <div className={s.content}>
        {showChannels && (
          <section className={s.channelsSection}>
            <ChannelsSection
              channels={channels}
              loading={false}
              canAddAnother={channels.length < (me.channel_limit ?? 1)}
              onConnect={connectChannel}
              onUnlink={unlink}
              onRefresh={refreshChannel}
              busyId={busy}
            />
          </section>
        )}

        {showSplitPanel && (
          <SplitPanel
            activeChannelId={activeChannelId}
            tab={tab}
            onTabChange={setTab}
            videosWithMetrics={videosWithMetrics}
            selectedVideoId={selectedVideoId}
            selectedVideo={selectedVideo}
            videosLoading={videosLoading}
            showDetail={showDetail}
            onSelect={handleSelect}
            onBack={handleBack}
            plannedLeftContent={
              <PlannedLeftContent
                ideas={planned.ideas}
                selectedIdeaId={planned.selectedIdeaId}
                isNewIdea={planned.isNewIdea}
                onSelectIdea={handleSelectIdea}
                onNewIdea={handleNewIdea}
                ideasLoading={planned.ideasLoading}
                ideasError={planned.ideasError}
                onRetry={planned.refetchIdeas}
              />
            }
            plannedRightContent={
              <PlannedRightContent
                channelId={activeChannelId}
                isNewIdea={planned.isNewIdea}
                selectedIdea={planned.selectedIdea}
                hasSelection={planned.hasSelection}
                saving={planned.saving}
                onSave={planned.handleSave}
                onDiscard={planned.handleDiscard}
              />
            }
          />
        )}

        <SubscribeCta visible={!isSubscribed && channels.length > 0} />
      </div>
    </PageContainer>
  );
}
