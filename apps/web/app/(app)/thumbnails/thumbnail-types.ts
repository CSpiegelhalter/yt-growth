/**
 * Shared types for the thumbnails workflow.
 *
 * These types are used across multiple files in this directory,
 * so they live in a shared types file per project convention.
 */

export type StyleV2 = "compare" | "subject" | "object" | "hold";

export type UploadedPhoto = {
  id: string;
  url: string | null;
  width: number;
  height: number;
};

export type IdentityStatus =
  | { status: "none"; photoCount?: number; photos?: UploadedPhoto[] }
  | {
      status: "pending" | "training" | "ready" | "failed" | "canceled";
      identityModelId: string;
      triggerWord?: string;
      errorMessage?: string;
      photoCount?: number;
      photos?: UploadedPhoto[];
    };

export type UploadResult = {
  filename: string;
  status: "ok" | "error";
  id?: string;
  width?: number;
  height?: number;
  error?: string;
};

export type ThumbnailJobV2 = {
  jobId: string;
  status: "queued" | "running" | "succeeded" | "failed" | "canceled";
  style: StyleV2;
  source?: "txt2img" | "img2img";
  parentJobId?: string;
  outputImages: Array<{
    url: string;
    width?: number;
    height?: number;
    contentType?: string;
  }>;
};

export type PersistedThumbnail = {
  id: string;
  url: string;
  createdAt: number;
  jobId: string;
  style: StyleV2;
  source?: "txt2img" | "img2img";
};

export type ToastFn = (message: string, type: "success" | "error" | "info") => void;

export type ThumbnailsClientProps = {
  initialUser: {
    id: number;
    email: string;
    name: string | null;
    subscription?: {
      isActive: boolean;
      plan: string;
    };
  };
};

export type StyleCardData = {
  id: StyleV2;
  title: string;
  desc: string;
  examples: string[];
};
