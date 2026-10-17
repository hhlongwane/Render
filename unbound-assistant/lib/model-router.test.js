import test from "node:test";
import assert from "node:assert/strict";
import { getConfiguredProviders } from "./model-router.js";

const KEYS = [
  "OPENAI_API_KEY", "OPENAI_MODEL",
  "ANTHROPIC_API_KEY", "ANTHROPIC_MODEL",
  "GEMINI_API_KEY", "GEMINI_MODEL",
  "AI_COMPAT_BASE_URL", "AI_COMPAT_MODEL", "AI_COMPAT_API_KEY"
];

test("provider discovery only exposes configured providers and never returns credentials", () => {
  const previous = Object.fromEntries(KEYS.map(key => [key, process.env[key]]));
  try {
    for (const key of KEYS) delete process.env[key];
    assert.deepEqual(getConfiguredProviders(), []);

    process.env.OPENAI_API_KEY = "test-openai-secret";
    process.env.ANTHROPIC_API_KEY = "test-anthropic-secret";
    process.env.GEMINI_API_KEY = "test-gemini-secret";
    process.env.AI_COMPAT_BASE_URL = "https://example.invalid/v1";
    process.env.AI_COMPAT_MODEL = "test-model";
    process.env.AI_COMPAT_API_KEY = "test-compatible-secret";

    const providers = getConfiguredProviders();
    assert.deepEqual(providers.map(provider => provider.id), ["openai", "anthropic", "gemini", "compatible"]);
    assert.equal(providers.find(provider => provider.id === "openai").model, "gpt-5");
    assert.equal(providers.find(provider => provider.id === "anthropic").model, "claude-sonnet-4-5");
    assert.equal(providers.find(provider => provider.id === "gemini").model, "gemini-2.5-flash");
    assert.equal(JSON.stringify(providers).includes("test-openai-secret"), false);
    assert.equal(JSON.stringify(providers).includes("test-compatible-secret"), false);

    process.env.AI_COMPAT_BASE_URL = "http://example.invalid/v1";
    assert.equal(getConfiguredProviders().some(provider => provider.id === "compatible"), false);
  } finally {
    for (const key of KEYS) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
});
