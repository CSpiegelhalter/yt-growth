/**
 * Channel Profile Utilities
 * 
 * Hashing, cache validation, and helper functions.
 */

import crypto from "crypto";
import { ChannelProfileInput, PROFILE_CACHE_DAYS } from "./types";

/**
 * Compute a stable hash from the profile input for cache invalidation
 */
export function computeProfileInputHash(input: ChannelProfileInput): string {
  // Normalize the input for consistent hashing
  const normalized = {
    description: input.description.toLowerCase().trim(),
    categories: [...input.categories].sort(),
    customCategory: (input.customCategory || "").toLowerCase().trim(),
    formats: [...(input.formats || [])].sort(),
    audience: (input.audience || "").toLowerCase().trim(),
    tone: [...(input.tone || [])].sort(),
    examples: (input.examples || []).map(e => e.toLowerCase().trim()).sort(),
    goals: [...(input.goals || [])].sort(),
  };

  const json = JSON.stringify(normalized);
  return crypto.createHash("md5").update(json).digest("hex");
}

/**
 * Check if the AI profile cache is still valid
 */
export function isProfileCacheValid(
  lastGeneratedAt: Date | null,
  currentInputHash: string,
  storedInputHash: string
): boolean {
  // If hashes don't match, cache is invalid (input changed)
  if (currentInputHash !== storedInputHash) {
    return false;
  }

  // If no generation date, cache is invalid
  if (!lastGeneratedAt) {
    return false;
  }

  // Check if within cache duration (3 days)
  const cacheExpiresAt = new Date(lastGeneratedAt);
  cacheExpiresAt.setDate(cacheExpiresAt.getDate() + PROFILE_CACHE_DAYS);

  return new Date() < cacheExpiresAt;
}

/**
 * Sanitize user-provided text for safe storage and rendering
 * Removes potential XSS vectors while preserving legitimate content
 */
export function sanitizeUserText(text: string): string {
  return text
    // Remove script tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    // Remove event handlers
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
    // Remove javascript: URLs
    .replace(/javascript:/gi, "")
    // Encode HTML entities for special characters
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Sanitize the entire profile input
 */
export function sanitizeProfileInput(input: ChannelProfileInput): ChannelProfileInput {
  return {
    description: sanitizeUserText(input.description),
    categories: input.categories.map(c => sanitizeUserText(c)),
    customCategory: input.customCategory ? sanitizeUserText(input.customCategory) : undefined,
    formats: input.formats?.map(f => sanitizeUserText(f)),
    audience: input.audience ? sanitizeUserText(input.audience) : undefined,
    tone: input.tone?.map(t => sanitizeUserText(t)),
    examples: input.examples?.map(e => sanitizeUserText(e)),
    goals: input.goals?.map(g => sanitizeUserText(g)),
  };
}

/**
 * Format the profile input for LLM consumption
 * Creates a human-readable summary without sensitive formatting
 */
export function formatInputForLLM(input: ChannelProfileInput): string {
  const lines: string[] = [];

  lines.push(`CHANNEL DESCRIPTION:\n${input.description}`);
  lines.push(`\nPRIMARY CATEGORIES: ${input.categories.join(", ")}`);

  if (input.customCategory) {
    lines.push(`\nCUSTOM CATEGORY: ${input.customCategory}`);
  }

  if (input.formats && input.formats.length > 0) {
    lines.push(`\nCONTENT FORMATS: ${input.formats.join(", ")}`);
  }

  if (input.audience) {
    lines.push(`\nTARGET AUDIENCE: ${input.audience}`);
  }

  // Legacy fields (kept for backwards compatibility but may be empty)
  if (input.tone && input.tone.length > 0) {
    lines.push(`\nTONE/STYLE: ${input.tone.join(", ")}`);
  }

  if (input.examples && input.examples.filter(Boolean).length > 0) {
    lines.push(`\nEXAMPLE VIDEO TOPICS:\n${input.examples.filter(Boolean).map((e, i) => `${i + 1}. ${e}`).join("\n")}`);
  }

  if (input.goals && input.goals.length > 0) {
    lines.push(`\nCHANNEL GOALS: ${input.goals.join(", ")}`);
  }

  return lines.join("\n");
}
