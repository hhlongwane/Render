const ALLOWED_DOMAINS = new Set(["trading", "crypto", "shopify"]);

function config() {
  const base = String(process.env.SURVIVAL_AI_BASE_URL || "").trim().replace(/\/+$/, "");
  const token = String(process.env.SURVIVAL_AI_INTEGRATION_TOKEN || "").trim();
  if (!base || !token) return { configured: false, base: "", token: "" };
  let parsed;
  try { parsed = new URL(base); } catch { throw new Error("SURVIVAL_AI_BASE_URL must be a valid URL."); }
  if (!["https:", "http:"].includes(parsed.protocol)) throw new Error("Survival AI URL must use HTTPS (HTTP is allowed only for local development).");
  if (parsed.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(parsed.hostname)) {
    throw new Error("Survival AI integration requires HTTPS outside local development.");
  }
  return { configured: true, base, token };
}

async function request(path, payload) {
  const settings = config();
  if (!settings.configured) {
    const error = new Error("Survival AI bridge is not configured. Set SURVIVAL_AI_BASE_URL and SURVIVAL_AI_INTEGRATION_TOKEN in GENESIS server settings.");
    error.code = "SURVIVAL_NOT_CONFIGURED";
    throw error;
  }
  const response = await fetch(settings.base + path, {
    method: payload ? "POST" : "GET",
    redirect: "error",
    cache: "no-store",
    headers: {
      "accept": "application/json",
      "content-type": "application/json",
      "x-survival-ai-token": settings.token
    },
    body: payload ? JSON.stringify(payload) : undefined,
    signal: AbortSignal.timeout(30000)
  });
  const raw = await response.text();
  let data;
  try { data = JSON.parse(raw); } catch { data = {}; }
  if (!response.ok) {
    const message = typeof data.detail === "string" ? data.detail : `Survival AI returned HTTP ${response.status}.`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return data;
}

export function survivalBridgeStatus() {
  const settings = config();
  return {
    configured: settings.configured,
    service: "Survival AI",
    supportedDomains: [...ALLOWED_DOMAINS],
    executionAuthority: "none",
    note: settings.configured ? "Connection configured; checking remote service is a separate request." : "Add the service URL and a dedicated integration token to enable the bridge."
  };
}

export async function getSurvivalStatus() {
  return request("/api/integration/v1/status");
}

export async function analyzeWithSurvival(input) {
  const domain = String(input?.domain || "").trim().toLowerCase();
  const goal = String(input?.goal || "").trim();
  const evidence = input?.evidence ?? [];
  const context = input?.context ?? {};
  if (!ALLOWED_DOMAINS.has(domain)) throw new Error("Domain must be trading, crypto, or shopify.");
  if (!goal || goal.length > 2000) throw new Error("Goal must be 1–2,000 characters.");
  if (!Array.isArray(evidence) || evidence.length > 30) throw new Error("Evidence must be an array of at most 30 items.");
  if (!context || typeof context !== "object" || Array.isArray(context)) throw new Error("Context must be a JSON object.");
  const size = Buffer.byteLength(JSON.stringify({ evidence, context }), "utf8");
  if (size > 20000) throw new Error("Evidence and context must be under 20,000 bytes.");
  return request("/api/integration/v1/analyze", { domain, goal, evidence, context });
}
