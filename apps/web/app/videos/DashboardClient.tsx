"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import ChannelsSection from "@/components/dashboard/ChannelSection";
import ErrorAlert from "@/components/dashboard/ErrorAlert";
import { PageContainer } from "@/components/ui";
import { useSyncActiveChannel } from "@/lib/use-sync-active-channel";
import { enhanceVideosWithMetrics, sortVideos } from "@/lib/video-tools";
import type { Channel, Me } from "@/types/api";

import { SplitPanel } from "./components/SplitPanel";
import { SubscribeCta } from "./components/SubscribeCta";
import { SuccessAlert } from "./components/SuccessAlert";
import {
  connectChannel,
  deriveInsightVideos,
  deriveVideoMarkers,
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

// ── Types ────────────────────────────────────────────────────

type Props = {
  initialMe: Me;
  initialChannels: Channel[];
  initialActiveChannelId: string | null;
  checkoutStatus?: string;
};

// ── Main Component ───────────────────────────────────────────

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

  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const activeChannel = channels.find((c) => c.channel_id === activeChannelId) ?? null;
  const canAddAnother = channels.length < (me.channel_limit ?? 1);
  const isSubscribed = me.subscription?.isActive ?? false;

  const videosWithMetrics = useMemo(
    () => sortVideos(enhanceVideosWithMetrics(videos.map(toDashboardVideo)), "newest"),
    [videos],
  );
  const insightVideos = useMemo(() => deriveInsightVideos(videosWithMetrics), [videosWithMetrics]);
  const videoMarkers = useMemo(() => deriveVideoMarkers(videosWithMetrics), [videosWithMetrics]);

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

  function handleSelect(id: string | null) {
    setSelectedVideoId(id);
    setShowDetail(true);
  }

  return (
    <PageContainer>
      {success && <SuccessAlert message={success} onDismiss={() => setSuccess(null)} />}
      {err && <ErrorAlert message={err} />}

      <div className={s.content}>
        {(channels.length === 0 || !activeChannel) && (
          <section className={s.channelsSection}>
            <ChannelsSection
              channels={channels}
              loading={false}
              canAddAnother={canAddAnother}
              onConnect={connectChannel}
              onUnlink={unlink}
              onRefresh={refreshChannel}
              busyId={busy}
            />
          </section>
        )}

        {activeChannel && activeChannelId && (
          <SplitPanel
            activeChannelId={activeChannelId}
            videosWithMetrics={videosWithMetrics}
            insightVideos={insightVideos}
            videoMarkers={videoMarkers}
            selectedVideoId={selectedVideoId}
            selectedVideo={selectedVideo}
            videosLoading={videosLoading}
            showDetail={showDetail}
            onSelect={handleSelect}
            onBack={() => setShowDetail(false)}
          />
        )}

        <SubscribeCta visible={!isSubscribed && channels.length > 0} />
      </div>
    </PageContainer>
  );
}
