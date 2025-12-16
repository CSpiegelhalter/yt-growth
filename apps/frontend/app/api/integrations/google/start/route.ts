import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/prisma";
import crypto from "crypto";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = Number((session?.user as any)?.id);
  if (!userId) {
    return NextResponse.redirect(new URL("/auth/login", process.env.NEXT_PUBLIC_WEB_URL));
  }

  const state = crypto.randomBytes(24).toString("hex");

  await prisma.oAuthState.create({
    data: {
      state,
      userId,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min expiry
    },
  });

  const redirectUri = process.env.GOOGLE_REDIRECT_URI ?? process.env.GOOGLE_OAUTH_REDIRECT!;
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope: [
      "openid",
      "email",
      "profile",
      "https://www.googleapis.com/auth/youtube.readonly",
      "https://www.googleapis.com/auth/yt-analytics.readonly",
    ].join(" "),
    state,
  });

  return NextResponse.redirect("https://accounts.google.com/o/oauth2/v2/auth?" + params.toString());
}
