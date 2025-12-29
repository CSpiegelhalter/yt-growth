/**
 * Test-only: Direct sign-in for E2E tests
 *
 * This bypasses the UI login form for faster, more reliable E2E tests.
 * Only works when APP_TEST_MODE=1
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma";
import { requireTestMode, logTestAction } from "@/lib/test-mode";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { encode } from "next-auth/jwt";

export async function POST(req: NextRequest) {
  const guardResponse = requireTestMode();
  if (guardResponse) return guardResponse;

  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: { subscription: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: `User not found: ${email}` },
        { status: 404 }
      );
    }

    // Verify password
    if (!user.passwordHash) {
      return NextResponse.json(
        { error: "User has no password (OAuth only)" },
        { status: 400 }
      );
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    // Create session token
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      return NextResponse.json(
        { error: "NEXTAUTH_SECRET not configured" },
        { status: 500 }
      );
    }

    const token = await encode({
      token: {
        sub: String(user.id),
        email: user.email,
        name: user.name,
        id: user.id,
      },
      secret,
      maxAge: 24 * 60 * 60, // 24 hours
    });

    // Set the session cookie
    const cookieStore = await cookies();
    const isSecure = process.env.NODE_ENV === "production";
    const cookieName = isSecure
      ? "__Secure-next-auth.session-token"
      : "next-auth.session-token";

    cookieStore.set(cookieName, token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      path: "/",
      maxAge: 24 * 60 * 60,
    });

    logTestAction("auth/signin", { userId: user.id, email: user.email });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.subscription?.plan || "free",
      },
    });
  } catch (err: unknown) {
    console.error("[test/auth/signin] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
