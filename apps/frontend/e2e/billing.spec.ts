/**
 * Billing E2E Tests
 *
 * Tests subscription state changes:
 * - PRO upgrade
 * - Downgrade to FREE
 * - Subscription cancellation (with end date)
 * - End-of-period behavior
 */
import { test, expect } from "@playwright/test";
import {
  signIn,
  setBillingState,
  getMe,
  DEMO_USER,
} from "./fixtures/test-helpers";

test.describe("Billing States", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, DEMO_USER);
  });

  test("set PRO changes plan and limits", async ({ page }) => {
    const success = await setBillingState(page, "free");
    expect(success).toBe(true); // Requires APP_TEST_MODE=1

    // Verify free state
    let me = await getMe(page);
    expect(me.plan).toBe("free");

    // Upgrade to PRO
    expect(await setBillingState(page, "pro")).toBe(true);

    // Verify PRO state
    me = await getMe(page);
    expect(me.plan).toBe("pro");
    expect(me.usage?.owned_video_analysis?.limit).toBe(100);
  });

  test("set FREE downgrades plan and limits", async ({ page }) => {
    expect(await setBillingState(page, "pro")).toBe(true);

    // Verify PRO state
    let me = await getMe(page);
    expect(me.plan).toBe("pro");

    // Downgrade to FREE
    expect(await setBillingState(page, "free")).toBe(true);

    // Verify FREE state
    me = await getMe(page);
    expect(me.plan).toBe("free");
    expect(me.usage?.owned_video_analysis?.limit).toBe(5);
  });

  test("canceled subscription with future end date stays PRO", async ({ page }) => {
    // Set up canceled with future end date
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    expect(await setBillingState(page, "canceled", { endsAt: futureDate })).toBe(true);

    // Should still be treated as PRO
    const me = await getMe(page);
    expect(me.plan).toBe("pro");
    expect(me.usage?.owned_video_analysis?.limit).toBe(100);
  });

  test("canceled subscription with past end date becomes FREE", async ({ page }) => {
    // First set to PRO
    expect(await setBillingState(page, "pro")).toBe(true);

    // Then cancel with past end date
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    expect(await setBillingState(page, "canceled", { endsAt: pastDate })).toBe(true);

    // Should now be FREE
    const me = await getMe(page);
    expect(me.plan).toBe("free");
    expect(me.usage?.owned_video_analysis?.limit).toBe(5);
  });

  test("profile page shows plan badge", async ({ page }) => {
    // Set to PRO
    expect(await setBillingState(page, "pro")).toBe(true);

    await page.goto("/profile");
    await page.waitForLoadState("networkidle");

    // Should show PRO badge/indicator
    await expect(page.locator('text=/pro/i')).toBeVisible({ timeout: 10000 });
  });

  test("profile page shows FREE plan correctly", async ({ page }) => {
    expect(await setBillingState(page, "free")).toBe(true);

    await page.goto("/profile");
    await page.waitForLoadState("networkidle");

    // Should show free indicator
    await expect(page.locator('text=/free/i')).toBeVisible({ timeout: 10000 });
  });

  test("profile page shows cancellation status", async ({ page }) => {
    const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    expect(await setBillingState(page, "canceled", { endsAt: futureDate })).toBe(true);

    await page.goto("/profile");
    await page.waitForLoadState("networkidle");

    // Should indicate subscription is canceled/ending
    // Look for cancellation-related text
    const cancelIndicator = page.locator('text=/cancel|ending|expires/i');
    await expect(cancelIndicator).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Billing UI Prompts", () => {
  test("free user sees upgrade prompt on limits", async ({ page }) => {
    await signIn(page, DEMO_USER);
    expect(await setBillingState(page, "free")).toBe(true);

    await page.goto("/profile");
    await page.waitForLoadState("networkidle");

    // Should see upgrade option
    const upgradeBtn = page.locator('text=/upgrade|subscribe/i');
    await expect(upgradeBtn.first()).toBeVisible({ timeout: 10000 });
  });

  test("pro user sees manage subscription option", async ({ page }) => {
    await signIn(page, DEMO_USER);
    expect(await setBillingState(page, "pro")).toBe(true);

    await page.goto("/profile");
    await page.waitForLoadState("networkidle");

    // Should see manage subscription option
    const manageBtn = page.locator('text=/manage|subscription|billing/i');
    await expect(manageBtn.first()).toBeVisible({ timeout: 10000 });
  });
});

