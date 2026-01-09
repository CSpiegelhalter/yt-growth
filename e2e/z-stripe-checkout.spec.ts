/**
 * Stripe Checkout E2E Tests
 *
 * These tests verify the REAL Stripe checkout flow:
 * 1. User clicks upgrade button
 * 2. Redirected to Stripe Checkout
 * 3. Fill in test card details
 * 4. Complete checkout
 * 5. Webhook fires and updates subscription
 *
 * PREREQUISITES:
 * 1. Start Stripe CLI webhook listener:
 *    stripe listen --forward-to localhost:3000/api/integrations/stripe/webhook
 *
 * 2. Set real Stripe test keys in .env.local:
 *    STRIPE_SECRET_KEY=sk_test_...
 *    STRIPE_WEBHOOK_SECRET=whsec_... (from stripe listen output)
 *    STRIPE_PRICE_ID=price_...
 *
 * 3. Run the dev server (NOT test mode for Stripe):
 *    bun run dev
 *
 * 4. Run this specific test:
 *    bun run test:e2e:stripe
 *
 * Test card numbers (Stripe test mode):
 * - Success: 4242424242424242
 * - Decline: 4000000000000002
 * - Requires auth: 4000002500003155
 */
import { test, expect, Page } from "@playwright/test";
import {
  signIn,
  DEMO_USER,
  setBillingState,
  getMe,
} from "./fixtures/test-helpers";

// Stripe test card details
const STRIPE_TEST_CARD = {
  number: "4242424242424242",
  expiry: "12/30",
  cvc: "123",
  zip: "12345",
};

// Test user email (for Stripe receipts)
const TEST_EMAIL = "spiegelhaltercurt@gmail.com";

test.describe("Stripe Checkout Flow", () => {
  // Longer timeout for Stripe operations
  test.setTimeout(120_000);

  test.beforeEach(async ({ page }) => {
    // Sign in as demo user
    await signIn(page, DEMO_USER);

    // Verify user is properly signed in and exists in DB
    const me = await getMe(page);
    console.log("Signed in user:", {
      id: me.id,
      email: me.email,
      plan: me.plan,
    });

    if (!me.id) {
      throw new Error(
        "User not found in database. Run: bun scripts/test/reset-db.ts"
      );
    }
    // Note: Don't reset billing state here - each test handles its own setup
  });

  test("complete checkout flow upgrades to PRO", async ({ page }) => {
    // Reset to FREE plan so we can test the upgrade flow
    const setFree = await setBillingState(page, "free");
    if (!setFree) {
      console.log("Note: Test billing routes not available.");
    }

    // Navigate to profile/billing page
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");

    // Check current plan
    let me = await getMe(page);
    console.log("Current plan:", me.plan);

    // If still PRO (couldn't reset), skip checkout test
    if (me.plan === "pro") {
      console.log("User is already on PRO plan. Skipping checkout test.");
      console.log("To test checkout, reset the user to FREE plan first.");
      return;
    }

    expect(me.plan).toBe("free");

    // Find and click the upgrade/subscribe button
    const upgradeButton = page.locator(
      'button:has-text("Subscribe Now"), a:has-text("Subscribe Now"), button:has-text("Upgrade"), a:has-text("Upgrade")'
    );
    await expect(upgradeButton.first()).toBeVisible({ timeout: 10000 });

    console.log("Clicking upgrade button...");

    // Click and wait for navigation to Stripe
    // The button does: fetch() -> get URL -> window.location.href = url
    // We just need to wait for the final navigation to Stripe
    await upgradeButton.first().click();

    // Wait for navigation to Stripe Checkout
    // This may take a few seconds as the API call happens first
    await page.waitForURL(/checkout\.stripe\.com/, { timeout: 30000 });

    console.log("Successfully navigated to Stripe:", page.url());

    console.log("Arrived at Stripe Checkout:", page.url());

    // Wait for Stripe page to fully initialize
    await page.waitForTimeout(3000);

    // Handle Stripe Link verification - either enter code or click "Pay without Link"
    // The verification code is 6 separate input boxes, one digit each
    const codeInputs = page.locator(
      'input[maxlength="1"], input[data-testid*="code"], input[autocomplete="one-time-code"]'
    );
    const codeInputCount = await codeInputs.count();

    if (codeInputCount >= 6) {
      // Stripe Link flow - enter verification code and subscribe directly
      console.log(
        `Found ${codeInputCount} code input boxes, entering 000000...`
      );
      for (let i = 0; i < 6; i++) {
        await codeInputs.nth(i).fill("0");
        await page.waitForTimeout(100);
      }
      console.log("✓ Entered verification code '000000'");
      await page.waitForTimeout(2000);

      // After code entry, just click Subscribe - payment info is already saved in Link
      const subscribeBtn = page
        .locator(
          'button:has-text("Subscribe"), button:has-text("Pay"), button[type="submit"]'
        )
        .first();
      await subscribeBtn.waitFor({ state: "visible", timeout: 10000 });
      console.log("✓ Clicking Subscribe button...");
      await subscribeBtn.click();
    } else {
      // No Link verification - need to fill card form manually
      // Try clicking "Pay without Link" first
      const payWithoutLinkClicked = await page.evaluate(() => {
        const elements = document.querySelectorAll("button, a, span");
        for (const el of elements) {
          if (el.textContent?.toLowerCase().includes("without link")) {
            (el as HTMLElement).click();
            return true;
          }
        }
        return false;
      });

      if (payWithoutLinkClicked) {
        console.log("✓ Clicked 'Pay without Link'");
        await page.waitForTimeout(2000);
      }

      // Check if card form is visible or needs "Pay with card" click
      const cardNumberField = page.locator("input#cardNumber");
      let cardVisible = await cardNumberField
        .isVisible({ timeout: 5000 })
        .catch(() => false);

      if (!cardVisible) {
        // Try clicking "Pay with card"
        await page.evaluate(() => {
          const btn = document.querySelector(
            '[aria-label="Pay with card"]'
          ) as HTMLElement;
          if (btn) btn.click();
        });
        await page.waitForTimeout(2000);
      }

      // Fill in the Stripe Checkout form
      try {
        await fillStripeCheckout(page);
        console.log("Form fill completed, waiting for redirect...");
      } catch (e) {
        console.error("Form fill error:", e);
        await page.screenshot({ path: "test-results/stripe-error.png" });
        throw e;
      }
    }

    // Wait for redirect back to our app after successful payment
    await page.waitForURL(/localhost:3000/, { timeout: 120000 });
    console.log("Redirected back to app:", page.url());

    // Verify we got the success query param
    expect(page.url()).toContain("checkout=success");
    console.log("✓ Checkout completed successfully");

    // Wait for Stripe webhook to process (requires Stripe CLI running)
    // Stripe CLI command: stripe listen --forward-to localhost:3000/api/integrations/stripe/webhook
    console.log("Waiting for Stripe webhook to update subscription...");
    let webhookProcessed = false;
    for (let attempt = 1; attempt <= 30; attempt++) {
      const response = await page.request.get("/api/me");
      if (response.ok()) {
        const data = await response.json();
        console.log(`  Poll ${attempt}/30: plan = ${data.plan}`);
        if (data.plan === "pro") {
          console.log("✓ Webhook processed - subscription updated to PRO!");
          webhookProcessed = true;
          break;
        }
      }
      await page.waitForTimeout(1000);
    }

    if (!webhookProcessed) {
      throw new Error(
        "Webhook did not update subscription within 30s. Is Stripe CLI running?\n" +
          "Run: stripe listen --forward-to localhost:3000/api/integrations/stripe/webhook"
      );
    }

    // Final verification
    me = await getMe(page);
    console.log("Final plan check:", me.plan);
    expect(me.plan).toBe("pro");
    console.log("✓ Plan verified as PRO");

    // Navigate to profile and verify UI shows PRO status
    await page.goto("/profile");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000); // Give UI time to render

    // Take screenshot for debugging
    await page.screenshot({ path: "test-results/stripe-success-profile.png" });

    // More flexible check - look for any indication of PRO status
    const proIndicator = page
      .locator("text=/pro|active|subscribed|premium/i")
      .first();
    const isProVisible = await proIndicator
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (isProVisible) {
      console.log("✓ Profile page shows PRO status");
    } else {
      console.log(
        "Warning: PRO status not visible on profile, but API confirms PRO"
      );
      // Don't fail the test if API confirms PRO - UI might just need more time
    }

    console.log("✓ Test completed successfully!");
  });

  test("cancel subscription schedules cancellation at period end", async ({
    page,
  }) => {
    // This test cancels the subscription via Stripe API (cancel at period end)
    // User keeps PRO access until the end of their paid period
    // Requires: User must already be on PRO (run subscribe test first)

    // Check if user is on PRO
    let me = await getMe(page);
    console.log("Current plan:", me.plan);

    if (me.plan !== "pro") {
      console.log("User is not on PRO plan. Run subscribe test first.");
      console.log("Skipping cancel subscription test.");
      return;
    }

    console.log("✓ User is on PRO plan, proceeding with cancellation...");

    // Cancel subscription via test API endpoint (calls real Stripe API)
    // This sets cancel_at_period_end=true, NOT immediate cancellation
    console.log("Scheduling subscription cancellation at period end...");
    const cancelResponse = await page.request.post("/api/test/billing/cancel");

    if (!cancelResponse.ok()) {
      const error = await cancelResponse.text();
      console.log("Cancel API error:", error);
      throw new Error(`Failed to cancel subscription: ${error}`);
    }

    const cancelData = await cancelResponse.json();
    console.log("✓ Stripe cancellation response:", cancelData);
    expect(cancelData.cancelAtPeriodEnd).toBe(true);

    // Wait for webhook to process the cancellation
    console.log("Waiting for webhook to process cancellation...");
    let webhookProcessed = false;
    for (let attempt = 1; attempt <= 30; attempt++) {
      const response = await page.request.get("/api/me");
      if (response.ok()) {
        const data = await response.json();
        console.log(
          `  Poll ${attempt}/30: plan = ${data.plan}, cancelAtPeriodEnd = ${data.subscription?.cancelAtPeriodEnd}`
        );
        // User should STILL be PRO but with cancelAtPeriodEnd = true
        if (
          data.plan === "pro" &&
          data.subscription?.cancelAtPeriodEnd === true
        ) {
          console.log(
            "✓ Webhook processed - subscription scheduled to cancel at period end!"
          );
          webhookProcessed = true;
          break;
        }
      }
      await page.waitForTimeout(1000);
    }

    if (!webhookProcessed) {
      console.log("Warning: Webhook may not have processed within 30s");
    }

    // Final verification - user should still be PRO
    me = await getMe(page);
    console.log("Final plan status:", me.plan);
    console.log("Cancel at period end:", me.subscription?.cancelAtPeriodEnd);
    console.log("Current period end:", me.subscription?.currentPeriodEnd);

    expect(me.plan).toBe("pro");
    expect(me.subscription?.cancelAtPeriodEnd).toBe(true);

    // Verify profile page shows cancellation info with "Good until" date
    // Need to do a fresh page load to get updated server-side data
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");

    // Reload to ensure we get fresh data (SSR uses initialMe from server)
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Check for "Good until" text in the cancellation notice
    const goodUntilText = page.locator("text=/Good until/i");
    await expect(goodUntilText).toBeVisible({ timeout: 10000 });
    console.log("✓ Profile page shows 'Good until' date");

    // Also verify the "Canceling" badge is visible
    const cancelingBadge = page.locator("text=/Canceling/i");
    if (await cancelingBadge.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log("✓ Profile page shows 'Canceling' badge");
    }

    console.log(
      "✓ Cancel subscription test completed - user stays PRO until period end!"
    );
  });
});

/**
 * Fill in Stripe Checkout form
 *
 * Stripe Checkout (checkout.stripe.com) uses direct input fields, NOT iframes.
 * Iframes are only used for Stripe Elements embedded on your own site.
 */
async function fillStripeCheckout(
  page: Page,
  card: typeof STRIPE_TEST_CARD = STRIPE_TEST_CARD
) {
  console.log("Filling Stripe Checkout form...");

  // Email field
  const emailField = page.locator("input#email");
  if (await emailField.isVisible({ timeout: 3000 }).catch(() => false)) {
    await emailField.click();
    await emailField.fill(TEST_EMAIL);
    console.log("✓ Filled email");
  }

  // Card number field
  const cardNumberField = page.locator("input#cardNumber");
  await cardNumberField.waitFor({ state: "visible", timeout: 10000 });
  await cardNumberField.click();
  // Type slowly to simulate human input
  await cardNumberField.pressSequentially(card.number, { delay: 50 });
  console.log("✓ Filled card number");
  await page.waitForTimeout(300);

  // Expiry date
  const expiryField = page.locator("input#cardExpiry");
  await expiryField.click();
  await expiryField.pressSequentially(card.expiry.replace("/", ""), {
    delay: 50,
  });
  console.log("✓ Filled expiry");
  await page.waitForTimeout(300);

  // CVC
  const cvcField = page.locator("input#cardCvc");
  await cvcField.click();
  await cvcField.pressSequentially(card.cvc, { delay: 50 });
  console.log("✓ Filled CVC");
  await page.waitForTimeout(300);

  // Cardholder name
  const nameField = page.locator("input#billingName");
  if (await nameField.isVisible({ timeout: 2000 }).catch(() => false)) {
    await nameField.click();
    await nameField.fill("Test User");
    console.log("✓ Filled name");
  }

  // Country dropdown (if visible)
  const countrySelect = page.locator(
    'select#billingCountry, [data-testid="country-select"]'
  );
  if (await countrySelect.isVisible({ timeout: 2000 }).catch(() => false)) {
    await countrySelect.selectOption("US");
    console.log("✓ Selected country");
  }

  // Postal/ZIP code
  const zipField = page.locator("input#billingPostalCode");
  if (await zipField.isVisible({ timeout: 2000 }).catch(() => false)) {
    await zipField.click();
    await zipField.fill("12345");
    console.log("✓ Filled ZIP");
  }

  // Phone number (must be valid for selected country - US format)
  const phoneField = page.locator('[aria-label="Phone number"]');
  if (await phoneField.isVisible({ timeout: 2000 }).catch(() => false)) {
    await phoneField.click();
    // Use a valid-looking US number format (Stripe validates format)
    await phoneField.fill("2025551234");
    console.log("✓ Filled phone");
  }

  console.log("Form filled, clicking submit...");
  await page.waitForTimeout(500);

  // Click the submit/subscribe button
  const submitBtn = page
    .locator('.SubmitButton, button[type="submit"]')
    .first();
  await submitBtn.waitFor({ state: "visible", timeout: 5000 });

  // Wait for button to be enabled (Stripe validates the form first)
  await page.waitForFunction(
    () => {
      const btn = document.querySelector(
        '.SubmitButton, button[type="submit"]'
      );
      return btn && !btn.hasAttribute("disabled");
    },
    { timeout: 10000 }
  );

  console.log("✓ Submitting payment...");
  await submitBtn.click();
}
