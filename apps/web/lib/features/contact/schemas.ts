import { z } from "zod";

export const ContactBodySchema = z.object({
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
