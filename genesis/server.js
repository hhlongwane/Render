import http from "node:http";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createHmac, timingSafeEqual } from "node:crypto";
import { AGENTS, DIVISIONS } from "./lib/agents.js";
import { createResearchTask } from "./lib/engine.js";
import { validateResearchRequest } from "./lib/policy.js";
import { AuditLedger } from "./lib/audit.js";
import { runMultiAgentAnalysis } from "./lib/llm.js";
import { survivalBridgeStatus, getSurvivalStatus, analyzeWithSurvival } from "./lib/survival-bridge.js";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(ROOT, "public");
const PORT = Number(process.env.PORT || 3030);
const APP_PASSWORD = process.env.OMNISEC_APP_PASSWORD || "";
const SESSION_SECRET = process.env.OMNISEC_SESSION_SECRET || "";
const tasks = [];
const audit = new AuditLedger();
const MAX_BODY = 16 * 1024;
const authAttempts = new Map();
const analysisAttempts = new Map();
function limited(map, key, max, windowMs) {
  const now = Date.now();
  const current = map.get(key);
  if (!current || now >= current.resetAt) { map.set(key, { count: 1, resetAt: now + windowMs }); return false; }
  current.count += 1;
  return current.count > max;
}
const MIME = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".svg": "image/svg+xml" };

function json(res, status, data) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    "referrer-policy": "no-referrer"
  });
  res.end(JSON.stringify(data));
}

async function body(req) {
  let raw = "";
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > MAX_BODY) throw new Error("Request body too large.");
  }
  return raw ? JSON.parse(raw) : {};
}

function tokenFor(expiry) {
  const payload = String(expiry);
  const signature = createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
  return payload + "." + signature;
}

function validToken(token) {
  if (!SESSION_SECRET || typeof token !== "string") return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature || !/^\d+$/.test(payload) || Number(payload) < Date.now()) return false;
  const expected = createHmac("sha256", SESSION_SECRET).update(payload).digest();
  let supplied;
  try { supplied = Buffer.from(signature, "hex"); } catch { return false; }
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

function authenticated(req) {
  return validToken((req.headers.authorization || "").replace(/^Bearer\s+/i, ""));
}

function securityHeaders(res) {
  res.setHeader("content-security-policy", "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
  res.setHeader("x-frame-options", "DENY");
  res.setHeader("x-content-type-options", "nosniff");
  res.setHeader("referrer-policy", "no-referrer");
  res.setHeader("permissions-policy", "camera=(), microphone=(), geolocation=()");
}

async function handle(req, res) {
  securityHeaders(res);
  const url = new URL(req.url, "http://localhost");

  if (req.method === "GET" && url.pathname === "/api/health") {
    return json(res, 200, {
      ok: true,
      product: "OMNISEC GENESIS",
      version: "0.1.0",
      agents: AGENTS.length,
      divisions: DIVISIONS.length,
      accessConfigured: APP_PASSWORD.length >= 16 && SESSION_SECRET.length >= 32,
      mode: "controlled-research",
      providerConfigured: Boolean(process.env.OPENAI_API_KEY),
      limitations: ["No autonomous target access", "No shell or command execution", "No stealth or evidence destruction", "In-memory task storage"]
    });
  }

  if (req.method === "POST" && url.pathname === "/api/session") {
    const ip = req.socket.remoteAddress || "unknown";
    if (limited(authAttempts, ip, 8, 15 * 60 * 1000)) return json(res, 429, { error: "Too many sign-in attempts. Try again in 15 minutes." });
    const data = await body(req);
    if (APP_PASSWORD.length < 16 || SESSION_SECRET.length < 32) {
      return json(res, 503, { error: "Set OMNISEC_APP_PASSWORD (at least 16 characters) and OMNISEC_SESSION_SECRET (at least 32 characters) in the server environment." });
    }
    const supplied = Buffer.from(String(data.password || ""));
    const expected = Buffer.from(APP_PASSWORD);
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
      audit.append("authentication.denied", { ip: req.socket.remoteAddress || "unknown" });
      return json(res, 401, { error: "Access denied." });
    }
    const token = tokenFor(Date.now() + 8 * 60 * 60 * 1000);
    audit.append("authentication.granted", { sessionHours: 8 });
    return json(res, 200, { token, expiresIn: 28800 });
  }

  if (url.pathname.startsWith("/api/")) {
    if (!authenticated(req)) return json(res, 401, { error: "Authentication required." });

    if (req.method === "GET" && url.pathname === "/api/survival/status") {
      const local = survivalBridgeStatus();
      if (!local.configured) return json(res, 200, { ...local, connected: false });
      try {
        const remote = await getSurvivalStatus();
        audit.append("integration.survival.status_checked", { connected: true, modelMode: remote.model_mode });
        return json(res, 200, { ...local, connected: true, remote });
      } catch (error) {
        audit.append("integration.survival.status_failed", { reason: String(error?.message || "connection error").slice(0, 160) });
        return json(res, 502, { ...local, connected: false, error: error?.message || "Survival AI connection failed." });
      }
    }
    if (req.method === "POST" && url.pathname === "/api/survival/analyze") {
      try {
        const data = await body(req);
        const report = await analyzeWithSurvival(data);
        audit.append("integration.survival.analysis_completed", {
          domain: data.domain,
          modelBacked: report.model_backed === true,
          decision: report.decision,
          executionAuthority: "none"
        });
        return json(res, 200, { report });
      } catch (error) {
        audit.append("integration.survival.analysis_failed", {
          reason: String(error?.message || "analysis error").slice(0, 160)
        });
        const status = error?.code === "SURVIVAL_NOT_CONFIGURED" ? 503 : (error?.status || 502);
        return json(res, status, { error: error?.message || "Survival AI analysis failed." });
      }
    }
    if (req.method === "GET" && url.pathname === "/api/agents") {
      return json(res, 200, { agents: AGENTS, divisions: DIVISIONS });
    }
    if (req.method === "GET" && url.pathname === "/api/tasks") {
      return json(res, 200, { tasks: tasks.slice().reverse() });
    }
    if (req.method === "POST" && url.pathname === "/api/tasks") {
      const data = await body(req);
      const validation = validateResearchRequest(data);
      if (!validation.ok) return json(res, 400, { error: "Research request did not pass policy validation.", details: validation.errors });
      const task = createResearchTask(validation.value);
      tasks.push(task);
      audit.append("research.task.created", {
        taskId: task.id,
        objective: task.objective,
        scope: task.scope,
        assignedAgentIds: task.assignedAgents.map(agent => agent.id)
      });
      return json(res, 201, { task });
    }
    const sendIntelMatch = url.pathname.match(/^\\/api\\/tasks\\/([a-f0-9-]+)\\/send-to-survival$/);
    if (req.method === "POST" && sendIntelMatch) {
      const task = tasks.find(item => item.id === sendIntelMatch[1]);
      if (!task || !task.analysis) return json(res, 409, { error: "Complete GENESIS specialist analysis before sending an intelligence brief." });
      try {
        const data = await body(req);
        const domain = String(data.domain || "").trim().toLowerCase();
        if (!["trading", "crypto"].includes(domain)) return json(res, 400, { error: "Cyber-intelligence trade briefs support trading or crypto only." });
        const verification = task.analysis.independentVerification || {};
        const specialistFindings = task.analysis.specialistReports.map(item => ({
          specialist: item.agentName,
          summary: String(item.report?.summary || "").slice(0, 700),
          findings: Array.isArray(item.report?.findings) ? item.report.findings.slice(0, 4).map(finding => ({
            title: String(finding.title || "").slice(0, 180),
            severity: String(finding.severity || "unclassified").slice(0, 32),
            evidence: String(finding.evidence || "").slice(0, 500),
            confidence: finding.confidence ?? null
          })) : [],
          unknowns: Array.isArray(item.report?.unknowns) ? item.report.unknowns.slice(0, 4) : []
        }));
        const brief = {
          task_id: task.id,
          objective: task.objective,
          authorised_scope: task.scope,
          provenance: "AI-generated GENESIS specialist analysis based only on user-supplied notes and scope. No external target was contacted. Claims are hypotheses until independently sourced.",
          specialists: specialistFindings,
          independent_verification: {
            summary: String(verification.verification_summary || "").slice(0, 1000),
            supported_findings: Array.isArray(verification.supported_findings) ? verification.supported_findings.slice(0, 6) : [],
            disputed_claims: Array.isArray(verification.disputed_claims) ? verification.disputed_claims.slice(0, 6) : [],
            missing_evidence: Array.isArray(verification.missing_evidence) ? verification.missing_evidence.slice(0, 8) : [],
            overall_confidence: verification.overall_confidence ?? null
          }
        };
        const evidence = [{
          id: "genesis-" + task.id,
          source: "GENESIS AI-derived cyber research brief (not independently sourced)",
          summary: JSON.stringify(brief).slice(0, 12000),
          timestamp: task.analysis.completedAt
        }];
        const report = await analyzeWithSurvival({
          domain,
          goal: "Assess whether this GENESIS cyber-research brief has defensible implications for " + domain + " market risk or opportunity. Treat AI-generated claims as unverified hypotheses unless independently sourced. Prefer WAIT or RESEARCH. Do not infer a trade from a cyber finding alone.",
          evidence,
          context: {
            source_system: "OMNISEC GENESIS",
            source_task_id: task.id,
            provenance: brief.provenance,
            verification: brief.independent_verification,
            source_count: 1,
            evidence_status: "AI-derived; external source verification required",
            execution_authority: "none"
          }
        });
        audit.append("integration.genesis_intelligence.forwarded", { taskId: task.id, domain, decision: report.decision, executionAuthority: "none" });
        return json(res, 200, { report, provenance: brief.provenance });
      } catch (error) {
        audit.append("integration.genesis_intelligence.failed", { taskId: task.id, reason: String(error?.message || "analysis error").slice(0, 160) });
        const status = error?.code === "SURVIVAL_NOT_CONFIGURED" ? 503 : (error?.status || 502);
        return json(res, status, { error: error?.message || "Unable to forward intelligence to Survival AI." });
      }
    }
    const analyzeMatch = url.pathname.match(/^\/api\/tasks\/([a-f0-9-]+)\/analyze$/);
    if (req.method === "POST" && analyzeMatch) {
      const ip = req.socket.remoteAddress || "unknown";
      if (limited(analysisAttempts, ip, 6, 60 * 60 * 1000)) return json(res, 429, { error: "Analysis rate limit reached. Try again later." });
      const task = tasks.find(item => item.id === analyzeMatch[1]);
      if (!task) return json(res, 404, { error: "Research task not found." });
      try {
        const report = await runMultiAgentAnalysis(task);
        task.analysis = report;
        task.status = "analysed";
        audit.append("research.task.analysed", { taskId: task.id, model: report.model, specialistCount: report.specialistReports.length });
        return json(res, 200, { task });
      } catch (error) {
        audit.append("research.task.analysis_failed", { taskId: task.id, reason: String(error?.message || "provider error").slice(0, 180) });
        return json(res, error?.code === "PROVIDER_NOT_CONFIGURED" ? 503 : 502, { error: error?.message || "AI analysis failed." });
      }
    }
    if (req.method === "GET" && url.pathname === "/api/audit") {
      return json(res, 200, { verification: audit.verify(), events: audit.list().reverse() });
    }
    if (req.method === "GET" && url.pathname === "/api/overview") {
      return json(res, 200, {
        agents: AGENTS.length,
        divisions: DIVISIONS.length,
        tasks: tasks.length,
        audit: audit.verify(),
        recentTasks: tasks.slice(-5).reverse().map(({ id, title, status, createdAt }) => ({ id, title, status, createdAt }))
      });
    }
    return json(res, 404, { error: "API route not found." });
  }

  if (req.method !== "GET" && req.method !== "HEAD") return json(res, 405, { error: "Method not allowed." });
  const relative = url.pathname === "/" ? "index.html" : decodeURIComponent(url.pathname).replace(/^\/+/, "");
  const target = path.resolve(PUBLIC, relative);
  if (!target.startsWith(PUBLIC + path.sep) && target !== path.join(PUBLIC, "index.html")) return json(res, 403, { error: "Forbidden." });
  try {
    const content = await readFile(target);
    res.writeHead(200, { "content-type": MIME[path.extname(target)] || "application/octet-stream", "cache-control": "no-cache" });
    return res.end(req.method === "HEAD" ? undefined : content);
  } catch {
    return json(res, 404, { error: "Not found." });
  }
}

const server = http.createServer((req, res) => {
  handle(req, res).catch(error => {
    console.error("Request failed:", error?.message || error);
    if (!res.headersSent) json(res, error?.message === "Request body too large." ? 413 : 400, { error: error?.message === "Request body too large." ? error.message : "Invalid request." });
    else res.destroy();
  });
});

audit.append("system.started", { version: "0.1.0", agents: AGENTS.length });
server.listen(PORT, () => console.log(`OMNISEC GENESIS listening on port ${PORT}`));
