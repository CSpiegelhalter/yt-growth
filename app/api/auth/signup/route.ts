import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { createApiRoute } from "@/lib/api/route";
import { withValidation } from "@/lib/api/withValidation";
import { ApiError } from "@/lib/api/errors";
import { jsonOk } from "@/lib/api/response";

const BodySchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  email: z.string().trim().toLowerCase().email().max(255),
  password: z.string().min(12).max(200), // CASA 2.1.1: minimum 12 characters
});

export const POST = createApiRoute(
  { route: "/api/auth/signup" },
  withValidation({ body: BodySchema }, async (_req, _ctx, api, validated) => {
    const { name, email, password } = validated.body!;

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      throw new ApiError({
        code: "VALIDATION_ERROR",
        status: 409,
        message: "Email already registered",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name: name ?? null, email, passwordHash },
      select: { id: true, email: true, name: true },
    });

    return jsonOk({ user }, { status: 201, requestId: api.requestId });
  })
);

