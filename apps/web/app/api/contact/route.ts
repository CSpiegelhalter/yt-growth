/**
 * POST /api/contact
 *
 * Handle contact form submissions.
 * Sends email via Resend to the site owner.
 *
 * Auth: Not required (works for signed in and signed out users)
 */
import type { NextRequest } from "next/server";
import { Resend } from "resend";
import { createApiRoute } from "@/lib/api/route";
import { withValidation } from "@/lib/api/withValidation";
import { withRateLimit } from "@/lib/api/withRateLimit";
import { ApiError } from "@/lib/api/errors";
import { jsonOk } from "@/lib/api/response";
import { ContactBodySchema, sendContactMessage } from "@/lib/features/contact";

const resend = new Resend(process.env.RESEND_API_KEY);
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || process.env.ADMIN_EMAIL;

export const POST = createApiRoute(
  { route: "/api/contact" },
  withRateLimit(
    { operation: "contactForm", identifier: (api) => api.ip },
    withValidation(
      { body: ContactBodySchema },
      async (_req: NextRequest, _ctx, api, validated) => {
        if (!CONTACT_EMAIL) {
          throw new ApiError({
            code: "INTERNAL",
            status: 500,
            message: "Contact form is not configured",
          });
        }

        if (!process.env.RESEND_API_KEY) {
          throw new ApiError({
            code: "INTERNAL",
            status: 500,
            message: "Email service is not configured",
          });
        }

        const { email, subject, message } = validated.body!;

        const result = await sendContactMessage(
          { email, subject, message, ip: api.ip ?? undefined },
          {
            email: {
              async send(params) {
                const { data, error } = await resend.emails.send(params);
                return {
                  id: data?.id ?? null,
                  error: error ? { name: error.name, message: error.message } : null,
                };
              },
            },
            contactEmail: CONTACT_EMAIL,
            resendDomain: process.env.RESEND_DOMAIN || "resend.dev",
          },
        );

        return jsonOk(result, { requestId: api.requestId });
      },
    ),
  ),
);
