import type { DashboardVideo } from "@/lib/video-tools";
import type { Channel, Me } from "@/types/api";

export type Video = DashboardVideo & {
  id?: number;
  youtubeVideoId?: string;
  viewCount?: number | null;
};

export type DashboardProps = {
  initialMe: Me;
  initialChannels: Channel[];
  initialActiveChannelId: string | null;
  checkoutStatus?: string;
};

export type VideosApiResponse = {
  channelId: string;
  videos: Video[];
  pagination?: {
    offset: number;
    limit: number;
    hasMore: boolean;
  };
};
