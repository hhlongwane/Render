import test from "node:test";
import assert from "node:assert/strict";
import { survivalBridgeStatus } from "../lib/survival-bridge.js";

test("Survival AI bridge reports disabled until both settings exist", () => {
  const previousUrl = process.env.SURVIVAL_AI_BASE_URL;
  const previousToken = process.env.SURVIVAL_AI_INTEGRATION_TOKEN;
  delete process.env.SURVIVAL_AI_BASE_URL;
  delete process.env.SURVIVAL_AI_INTEGRATION_TOKEN;
  try {
    const status = survivalBridgeStatus();
    assert.equal(status.configured, false);
    assert.equal(status.executionAuthority, "none");
  } finally {
    if (previousUrl === undefined) delete process.env.SURVIVAL_AI_BASE_URL;
    else process.env.SURVIVAL_AI_BASE_URL = previousUrl;
    if (previousToken === undefined) delete process.env.SURVIVAL_AI_INTEGRATION_TOKEN;
    else process.env.SURVIVAL_AI_INTEGRATION_TOKEN = previousToken;
  }
});

test("Survival AI bridge accepts only explicit supported domains", async () => {
  const previousUrl = process.env.SURVIVAL_AI_BASE_URL;
  const previousToken = process.env.SURVIVAL_AI_INTEGRATION_TOKEN;
  process.env.SURVIVAL_AI_BASE_URL = "https://survival-ai.example";
  process.env.SURVIVAL_AI_INTEGRATION_TOKEN = "test-token";
  try {
    const { analyzeWithSurvival } = await import("../lib/survival-bridge.js");
    await assert.rejects(
      analyzeWithSurvival({ domain: "wallet", goal: "Inspect a wallet" }),
      /Domain must be trading, crypto, or shopify/
    );
  } finally {
    if (previousUrl === undefined) delete process.env.SURVIVAL_AI_BASE_URL;
    else process.env.SURVIVAL_AI_BASE_URL = previousUrl;
    if (previousToken === undefined) delete process.env.SURVIVAL_AI_INTEGRATION_TOKEN;
    else process.env.SURVIVAL_AI_INTEGRATION_TOKEN = previousToken;
  }
});
