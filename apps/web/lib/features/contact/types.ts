/**
 * Domain types for the contact feature.
 */

export type ContactSubject = "general" | "bug" | "feature" | "billing" | "other";

export type ContactMessageInput = {
  email: string;
  subject: ContactSubject;
  message: string;
  ip?: string;
};

export type ContactMessageResult = {
  success: true;
  message: string;
  id: string | null;
};
