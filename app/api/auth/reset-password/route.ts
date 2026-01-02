import { prisma } from "@/prisma";
import { z } from "zod";
import { createApiRoute } from "@/lib/api/route";
import { withValidation } from "@/lib/api/withValidation";
import { ApiError } from "@/lib/api/errors";
import { jsonOk } from "@/lib/api/response";
import { verifyPasswordResetToken } from "@/lib/jwt";
import { hash } from "@/lib/crypto";
import { logger } from "@/lib/logger";

const BodySchema = z.object({
  token: z.string().min(1),
  password: z.string().min(12).max(200), // CASA 2.1.1: minimum 12 characters
});

export const POST = createApiRoute(
  { route: "/api/auth/reset-password" },
  withValidation({ body: BodySchema }, async (_req, _ctx, api, validated) => {
    const { token, password } = validated.body!;

    // Verify the token
    let tokenData: { id: number; email: string };
    try {
      tokenData = verifyPasswordResetToken(token);
    } catch (error) {
      logger.warn("auth.reset_password.invalid_token", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw new ApiError({
        code: "VALIDATION_ERROR",
        status: 400,
        message: "Invalid or expired reset link. Please request a new one.",
      });
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { id: tokenData.id },
      select: { id: true, email: true },
    });

    if (!user) {
      throw new ApiError({
        code: "NOT_FOUND",
        status: 404,
        message: "User not found.",
      });
    }

    // Verify email matches (extra security)
    if (user.email !== tokenData.email) {
      logger.warn("auth.reset_password.email_mismatch", {
        userId: user.id,
        tokenEmail: tokenData.email,
      });
      throw new ApiError({
        code: "VALIDATION_ERROR",
        status: 400,
        message: "Invalid reset link. Please request a new one.",
      });
    }

    // Hash the new password and update
    const passwordHash = await hash(password);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    logger.info("auth.reset_password.success", { userId: user.id });

    return jsonOk(
      { message: "Password reset successfully." },
      { requestId: api.requestId }
    );
  })
);
