/**
 * POST /api/contact
 *
 * Handle contact form submissions.
 * Sends email via Resend to the site owner.
 *
 * Auth: Not required (works for signed in and signed out users)
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { BRAND } from "@/lib/brand";
import { createApiRoute } from "@/lib/api/route";
import { withValidation } from "@/lib/api/withValidation";
import { withRateLimit } from "@/lib/api/withRateLimit";
import { ApiError } from "@/lib/api/errors";
import { jsonOk } from "@/lib/api/response";

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Email where contact messages should be sent
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || process.env.ADMIN_EMAIL;

// Schema with validation
const ContactSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address")
    .max(255, "Email too long")
    .transform((e) => e.toLowerCase().trim()),
  subject: z
    .enum(["general", "bug", "feature", "billing", "other"])
    .default("general"),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(5000, "Message must be less than 5000 characters")
    .transform((m) => m.trim()),
});

// Subject line mapping
const SUBJECT_MAP: Record<string, string> = {
  general: "General Question",
  bug: "Bug Report",
  feature: "Feature Request",
  billing: "Billing / Subscription",
  other: "Other",
};

/**
 * Sanitize text to prevent email injection and XSS
 */
function sanitize(text: string): string {
  return (
    text
      // Remove any HTML tags
      .replace(/<[^>]*>/g, "")
      // Remove potential email header injection
      .replace(/\r\n|\r|\n/g, " ")
      .replace(/Content-Type:/gi, "")
      .replace(/MIME-Version:/gi, "")
      .replace(/Content-Transfer-Encoding:/gi, "")
      .replace(/bcc:/gi, "")
      .replace(/cc:/gi, "")
      .replace(/to:/gi, "")
      .replace(/from:/gi, "")
      // Trim excessive whitespace
      .replace(/\s+/g, " ")
      .trim()
  );
}

/**
 * Sanitize message body (preserves newlines)
 */
function sanitizeMessage(text: string): string {
  return (
    text
      // Remove any HTML tags
      .replace(/<[^>]*>/g, "")
      // Remove potential script content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      // Remove javascript: URLs
      .replace(/javascript:/gi, "")
      // Remove potential email header injection at the start
      .replace(/^(Content-Type:|MIME-Version:|bcc:|cc:|to:|from:)/gim, "")
      // Normalize newlines
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      // Limit consecutive newlines
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}

export const POST = createApiRoute(
  { route: "/api/contact" },
  withRateLimit(
    { operation: "contactForm", identifier: (api) => api.ip },
    withValidation({ body: ContactSchema }, async (_req: NextRequest, _ctx, api, validated) => {
      // Check for required config
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

      // Sanitize inputs
      const sanitizedEmail = sanitize(email);
      const sanitizedMessage = sanitizeMessage(message);
      const subjectKey = ((subject ?? "general") as keyof typeof SUBJECT_MAP) || "general";
      const subjectLine = SUBJECT_MAP[subjectKey] || "General Question";

      // Build email content
      const timestamp = new Date().toISOString();
      const textContent = `
New contact form submission from ${BRAND.name}

From: ${sanitizedEmail}
Subject: ${subjectLine}
Time: ${timestamp}

Message:
${sanitizedMessage}

---
This message was sent via the ${BRAND.name} contact form.
IP: ${api.ip ?? "unknown"}
    `.trim();

      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 24px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 20px;">New Contact Form Submission</h1>
  </div>
  
  <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
      <tr>
        <td style="padding: 8px 0; color: #64748b; width: 80px;">From:</td>
        <td style="padding: 8px 0; font-weight: 600;">
          <a href="mailto:${sanitizedEmail}" style="color: #6366f1; text-decoration: none;">${sanitizedEmail}</a>
        </td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #64748b;">Subject:</td>
        <td style="padding: 8px 0; font-weight: 600;">${subjectLine}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #64748b;">Time:</td>
        <td style="padding: 8px 0;">${new Date(timestamp).toLocaleString()}</td>
      </tr>
    </table>
    
    <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
      <p style="margin: 0 0 12px; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Message:</p>
      <div style="white-space: pre-wrap; color: #1e293b;">${sanitizedMessage.replace(
        /\n/g,
        "<br>"
      )}</div>
    </div>
    
    <p style="margin: 20px 0 0; font-size: 12px; color: #94a3b8;">
      Reply directly to this email to respond to ${sanitizedEmail}
    </p>
  </div>
  
    <p style="margin-top: 16px; font-size: 11px; color: #94a3b8; text-align: center;">
    Sent via ${BRAND.name} Contact Form • IP: ${api.ip ?? "unknown"}
  </p>
</body>
</html>
    `.trim();

      // Send email via Resend
      const { data, error } = await resend.emails.send({
        from: `${BRAND.name} <noreply@${process.env.RESEND_DOMAIN || "resend.dev"}>`,
        to: CONTACT_EMAIL,
        replyTo: sanitizedEmail,
        subject: `[${BRAND.name}] ${subjectLine} - from ${sanitizedEmail}`,
        text: textContent,
        html: htmlContent,
      });

      if (error) {
        throw new ApiError({
          code: "INTEGRATION_ERROR",
          status: 502,
          message: "Failed to send message. Please try again.",
          details: { provider: "resend" },
        });
      }

      return jsonOk(
        { success: true, message: "Your message has been sent!", id: data?.id ?? null },
        { requestId: api.requestId }
      );
    })
  )
);
