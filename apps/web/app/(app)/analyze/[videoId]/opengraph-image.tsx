import { ImageResponse } from "next/og";

import { brandPalette } from "@/lib/shared/brand";

export const runtime = "edge";
export const alt = "Video Analysis";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Props = {
  params: Promise<{ videoId: string }>;
};

/**
 * OG image for /analyze/[videoId] pages.
 *
 * Renders a branded card with the video thumbnail and analysis branding.
 * If the YouTube thumbnail can't be loaded, falls back to text-only.
 */
export default async function OGImage({ params }: Props) {
  const { videoId } = await params;
  const thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          background: `linear-gradient(165deg, ${brandPalette.hotRose} 0%, ${brandPalette.coolSky} 100%)`,
          padding: "48px",
        }}
      >
        {/* Card */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: "36px",
            background: "white",
            borderRadius: "20px",
            padding: "36px 44px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
            maxWidth: "1080px",
            width: "100%",
          }}
        >
          {/* Thumbnail */}
          { }
          <img
            src={thumbnailUrl}
            alt=""
            width={400}
            height={225}
            style={{
              borderRadius: "12px",
              objectFit: "cover",
              flexShrink: 0,
            }}
          />

          {/* Text */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              flex: 1,
            }}
          >
            <div
              style={{
                fontSize: "18px",
                fontWeight: 700,
                color: brandPalette.hotRose,
                textTransform: "uppercase" as const,
                letterSpacing: "0.05em",
              }}
            >
              Video Analysis
            </div>
            <div
              style={{
                fontSize: "28px",
                fontWeight: 700,
                color: brandPalette.imperialBlue,
                lineHeight: 1.3,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical" as const,
                overflow: "hidden",
              }}
            >
              See what&apos;s working in this video
            </div>
            <div
              style={{
                fontSize: "16px",
                color: "#64748b",
                lineHeight: 1.5,
              }}
            >
              Tags, comments, title patterns, and remix ideas — free on
              ChannelBoost
            </div>
          </div>
        </div>

        {/* Branding */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginTop: "24px",
            color: "white",
            fontSize: "20px",
            fontWeight: 700,
            letterSpacing: "0.02em",
          }}
        >
          ChannelBoost
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
