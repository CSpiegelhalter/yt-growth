import { prisma } from "@/prisma";
import { z } from "zod";
import { createApiRoute } from "@/lib/api/route";
import { withValidation } from "@/lib/api/withValidation";
import { jsonOk } from "@/lib/api/response";
import { issuePasswordResetToken } from "@/lib/jwt";
import { Resend } from "resend";
import { BRAND } from "@/lib/brand";
import { logger } from "@/lib/logger";

const resend = new Resend(process.env.RESEND_API_KEY);

const BodySchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
});

export const POST = createApiRoute(
  { route: "/api/auth/forgot-password" },
  withValidation({ body: BodySchema }, async (_req, _ctx, api, validated) => {
    const { email } = validated.body!;

    // Always return success to prevent email enumeration
    // But only send email if user exists with a password
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, passwordHash: true },
    });

    // Only proceed if user exists and has a password (not OAuth-only)
    if (user && user.passwordHash) {
      try {
        const token = issuePasswordResetToken({ id: user.id, email: user.email });
        const resetUrl = `${process.env.NEXTAUTH_URL || BRAND.url}/auth/reset-password?token=${token}`;

        if (process.env.RESEND_API_KEY) {
          const { data, error } = await resend.emails.send({
            from: `${BRAND.name} <noreply@${process.env.RESEND_DOMAIN || "resend.dev"}>`,
            to: user.email,
            subject: `Reset your ${BRAND.name} password`,
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #2563eb; margin: 0; font-size: 24px;">${BRAND.name}</h1>
                </div>
                
                <h2 style="color: #111; margin-bottom: 16px;">Reset your password</h2>
                
                <p>Hi${user.name ? ` ${user.name}` : ""},</p>
                
                <p>We received a request to reset your password. Click the button below to choose a new password:</p>
                
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${resetUrl}" style="display: inline-block; background-color: #2563eb; color: #fff; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-weight: 600;">Reset Password</a>
                </div>
                
                <p style="color: #666; font-size: 14px;">This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.</p>
                
                <p style="color: #666; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
                <p style="color: #666; font-size: 14px; word-break: break-all;">${resetUrl}</p>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">
                
                <p style="color: #999; font-size: 12px; text-align: center;">
                  © ${new Date().getFullYear()} ${BRAND.name}. All rights reserved.
                </p>
              </body>
              </html>
            `,
            text: `Reset your ${BRAND.name} password\n\nHi${user.name ? ` ${user.name}` : ""},\n\nWe received a request to reset your password. Visit this link to choose a new password:\n\n${resetUrl}\n\nThis link will expire in 1 hour. If you didn't request this, you can safely ignore this email.`,
          });

          if (error) {
            logger.error("auth.forgot_password.resend_error", {
              userId: user.id,
              error: error.name,
              message: error.message,
              to: user.email,
              from: `noreply@${process.env.RESEND_DOMAIN || "resend.dev"}`,
            });
            // In development, still log the reset URL so you can test
            if (process.env.NODE_ENV === "development") {
              logger.info("auth.forgot_password.dev_reset_url", {
                userId: user.id,
                resetUrl,
              });
            }
          } else {
            logger.info("auth.forgot_password.email_sent", {
              userId: user.id,
              emailId: data?.id,
              // In development, log the reset URL for easier testing
              ...(process.env.NODE_ENV === "development" ? { resetUrl } : {}),
            });
          }
        } else {
          // In development without Resend, log the reset URL
          logger.info("auth.forgot_password.dev_mode", {
            userId: user.id,
            resetUrl,
          });
        }
      } catch (error) {
        // Log error but still return success to prevent enumeration
        logger.error("auth.forgot_password.email_failed", {
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    } else if (user && !user.passwordHash) {
      // User exists but signed up with OAuth - log for debugging
      logger.info("auth.forgot_password.oauth_user", { userId: user.id });
    }

    // Always return success to prevent email enumeration
    return jsonOk(
      { message: "If an account exists, a reset link has been sent." },
      { requestId: api.requestId }
    );
  })
);
