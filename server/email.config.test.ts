import { describe, expect, it } from "vitest";

describe("Resend email configuration", () => {
  it("recognizes the configured send-only API key and sender address", async () => {
    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL;

    expect(apiKey, "RESEND_API_KEY must be configured").toBeTruthy();
    expect(fromEmail, "RESEND_FROM_EMAIL must be configured").toMatch(/.+@.+/);

    const response = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const body = await response.text();

    // Restricted Resend keys are valid for email sending but cannot list domains.
    expect(response.ok || body.includes("restricted_api_key"), body).toBe(true);
  }, 15_000);
});
