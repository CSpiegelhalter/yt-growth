import { Resend } from "resend";
import { z } from "zod";

import { jsonOk } from "@/lib/api/response";
import { createApiRoute } from "@/lib/api/route";
import { withValidation } from "@/lib/api/withValidation";
import { issuePasswordResetToken } from "@/lib/server/auth";
import { BRAND, brandPalette } from "@/lib/shared/brand";
import { logger } from "@/lib/shared/logger";
import { prisma } from "@/prisma";

const resend = new Resend(process.env.RESEND_API_KEY);

const BodySchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
});

type PasswordUser = { id: number; email: string; name: string | null };

function buildResetUrl(user: PasswordUser): string {
  const token = issuePasswordResetToken({ id: user.id, email: user.email });
  return `${process.env.NEXTAUTH_URL || BRAND.url}/auth/reset-password?token=${token}`;
}

function buildResetEmailHtml(user: PasswordUser, resetUrl: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: ${brandPalette.imperialBlue}; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: ${brandPalette.coolSky}; margin: 0; font-size: 24px;">${BRAND.name}</h1>
  </div>
  <h2 style="color: ${brandPalette.imperialBlue}; margin-bottom: 16px;">Reset your password</h2>
  <p>Hi${user.name ? ` ${user.name}` : ""},</p>
  <p>We received a request to reset your password. Click the button below to choose a new password:</p>
  <div style="text-align: center; margin: 32px 0;">
    <a href="${resetUrl}" style="display: inline-block; background-color: ${brandPalette.hotRose}; color: #fff; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-weight: 600;">Reset Password</a>
  </div>
  <p style="color: #666; font-size: 14px;">This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.</p>
  <p style="color: #666; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
  <p style="color: #666; font-size: 14px; word-break: break-all;">${resetUrl}</p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">
  <p style="color: #999; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} ${BRAND.name}. All rights reserved.</p>
</body>
</html>`;
}

function buildResetEmailText(user: PasswordUser, resetUrl: string): string {
  return `Reset your ${BRAND.name} password\n\nHi${user.name ? ` ${user.name}` : ""},\n\nWe received a request to reset your password. Visit this link to choose a new password:\n\n${resetUrl}\n\nThis link will expire in 1 hour. If you didn't request this, you can safely ignore this email.`;
}

async function sendResetEmailViaResend(user: PasswordUser, resetUrl: string): Promise<void> {
  const { data, error } = await resend.emails.send({
    from: `${BRAND.name} <noreply@${process.env.RESEND_DOMAIN || "resend.dev"}>`,
    to: user.email,
    subject: `Reset your ${BRAND.name} password`,
    html: buildResetEmailHtml(user, resetUrl),
    text: buildResetEmailText(user, resetUrl),
  });

  if (error) {
    logger.error("auth.forgot_password.resend_error", {
      userId: user.id,
      error: error.name,
      message: error.message,
      to: user.email,
      from: `noreply@${process.env.RESEND_DOMAIN || "resend.dev"}`,
    });
    if (process.env.NODE_ENV === "development") {
      logger.info("auth.forgot_password.dev_reset_url", { userId: user.id, resetUrl });
    }
  } else {
    logger.info("auth.forgot_password.email_sent", {
      userId: user.id,
      emailId: data?.id,
      ...(process.env.NODE_ENV === "development" ? { resetUrl } : {}),
    });
  }
}

async function sendPasswordResetEmail(user: PasswordUser): Promise<void> {
  const resetUrl = buildResetUrl(user);

  if (process.env.RESEND_API_KEY) {
    await sendResetEmailViaResend(user, resetUrl);
  } else {
    logger.info("auth.forgot_password.dev_mode", { userId: user.id, resetUrl });
  }
}

export const POST = createApiRoute(
  { route: "/api/auth/forgot-password" },
  withValidation({ body: BodySchema }, async (_req, _ctx, api, validated) => {
    const { email } = validated.body!;

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, passwordHash: true },
    });

    if (user && user.passwordHash) {
      try {
        await sendPasswordResetEmail(user);
      } catch (error) {
        logger.error("auth.forgot_password.email_failed", {
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    } else if (user && !user.passwordHash) {
      logger.info("auth.forgot_password.oauth_user", { userId: user.id });
    }

    return jsonOk(
      { message: "If an account exists, a reset link has been sent." },
      { requestId: api.requestId }
    );
  })
);
