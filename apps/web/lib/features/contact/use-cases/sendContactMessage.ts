/**
 * Send Contact Message Use-Case
 *
 * Sanitizes inputs and sends a contact form email via an email provider.
 */

import { BRAND } from "@/lib/shared/brand";
import { logger } from "@/lib/shared/logger";
import { ContactError } from "../errors";
import type { ContactMessageInput, ContactMessageResult, ContactSubject } from "../types";

// ── Dependencies ────────────────────────────────────────────

type SendContactMessageDeps = {
  email: {
    send(params: {
      from: string;
      to: string;
      replyTo: string;
      subject: string;
      text: string;
      html: string;
    }): Promise<{ id: string | null; error: { name: string; message: string } | null }>;
  };
  contactEmail: string;
  resendDomain: string;
};

// ── Helpers ─────────────────────────────────────────────────

const SUBJECT_MAP: Record<ContactSubject, string> = {
  general: "General Question",
  bug: "Bug Report",
  feature: "Feature Request",
  billing: "Billing / Subscription",
  other: "Other",
};

function sanitizeField(text: string): string {
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/\r\n|\r|\n/g, " ")
    .replace(/Content-Type:/gi, "")
    .replace(/MIME-Version:/gi, "")
    .replace(/Content-Transfer-Encoding:/gi, "")
    .replace(/bcc:/gi, "")
    .replace(/cc:/gi, "")
    .replace(/to:/gi, "")
    .replace(/from:/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function sanitizeBody(text: string): string {
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/^(Content-Type:|MIME-Version:|bcc:|cc:|to:|from:)/gim, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function buildTextContent(
  sanitizedEmail: string,
  subjectLine: string,
  sanitizedMessage: string,
  timestamp: string,
  ip: string,
): string {
  return `
New contact form submission from ${BRAND.name}

From: ${sanitizedEmail}
Subject: ${subjectLine}
Time: ${timestamp}

Message:
${sanitizedMessage}

---
This message was sent via the ${BRAND.name} contact form.
IP: ${ip}
  `.trim();
}

function buildHtmlContent(
  sanitizedEmail: string,
  subjectLine: string,
  sanitizedMessage: string,
  timestamp: string,
  ip: string,
): string {
  return `
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
      <div style="white-space: pre-wrap; color: #1e293b;">${sanitizedMessage.replace(/\n/g, "<br>")}</div>
    </div>
    
    <p style="margin: 20px 0 0; font-size: 12px; color: #94a3b8;">
      Reply directly to this email to respond to ${sanitizedEmail}
    </p>
  </div>
  
    <p style="margin-top: 16px; font-size: 11px; color: #94a3b8; text-align: center;">
    Sent via ${BRAND.name} Contact Form • IP: ${ip}
  </p>
</body>
</html>
  `.trim();
}

// ── Use-case ────────────────────────────────────────────────

export async function sendContactMessage(
  input: ContactMessageInput,
  deps: SendContactMessageDeps,
): Promise<ContactMessageResult> {
  const sanitizedEmail = sanitizeField(input.email);
  const sanitizedMessage = sanitizeBody(input.message);
  const subjectLine = SUBJECT_MAP[input.subject] ?? "General Question";
  const timestamp = new Date().toISOString();
  const ip = input.ip ?? "unknown";

  const textContent = buildTextContent(sanitizedEmail, subjectLine, sanitizedMessage, timestamp, ip);
  const htmlContent = buildHtmlContent(sanitizedEmail, subjectLine, sanitizedMessage, timestamp, ip);

  const { id, error } = await deps.email.send({
    from: `${BRAND.name} <noreply@${deps.resendDomain}>`,
    to: deps.contactEmail,
    replyTo: sanitizedEmail,
    subject: `[${BRAND.name}] ${subjectLine} - from ${sanitizedEmail}`,
    text: textContent,
    html: htmlContent,
  });

  if (error) {
    logger.error("Resend email failed", {
      route: "/api/contact",
      resendError: error.name,
      resendMessage: error.message,
      from: `noreply@${deps.resendDomain}`,
      to: deps.contactEmail,
    });
    throw new ContactError(
      "EXTERNAL_FAILURE",
      "Failed to send message. Please try again.",
      error,
    );
  }

  return {
    success: true,
    message: "Your message has been sent!",
    id: id ?? null,
  };
}
