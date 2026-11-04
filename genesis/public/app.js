const $ = (selector) => document.querySelector(selector);
let token = sessionStorage.getItem("omnisec_token") || "";
let activeTaskId = "";

async function api(path, options = {}) {
  const headers = { "content-type": "application/json", ...(options.headers || {}) };
  if (token) headers.authorization = "Bearer " + token;
  const response = await fetch(path, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (response.status === 401) {
    token = "";
    sessionStorage.removeItem("omnisec_token");
    showLogin();
    throw new Error("Your session expired. Sign in again.");
  }
  if (!response.ok) throw new Error(data.error || "Request failed.");
  return data;
}

function toast(message) {
  const el = $("#toast");
  el.textContent = message;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 2600);
}
function showLogin() {
  $("#login").classList.remove("hidden");
  $("#app").classList.add("hidden");
}
function showApp() {
  $("#login").classList.add("hidden");
  $("#app").classList.remove("hidden");
  refreshOverview();
}
function switchView(name) {
  document.querySelectorAll(".view").forEach(el => el.classList.add("hidden"));
  $("#view-" + name).classList.remove("hidden");
  document.querySelectorAll(".nav").forEach(el => el.classList.toggle("active", el.dataset.view === name));
  $("#view-title").textContent = ({ overview: "Overview", research: "Research tasks", agents: "Agent network", audit: "Audit ledger", survival: "Survival AI" })[name];
  if (name === "agents") loadAgents();
  if (name === "audit") loadAudit();
  if (name === "research") loadTasks();
  if (name === "survival") loadSurvivalStatus();
}
document.querySelectorAll(".nav").forEach(button => button.addEventListener("click", () => switchView(button.dataset.view)));
document.querySelectorAll("[data-go]").forEach(button => button.addEventListener("click", () => switchView(button.dataset.go)));

$("#login-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  $("#login-error").textContent = "";
  try {
    const data = await api("/api/session", { method: "POST", body: JSON.stringify({ password: $("#password").value }) });
    token = data.token;
    sessionStorage.setItem("omnisec_token", token);
    $("#password").value = "";
    showApp();
  } catch (error) {
    $("#login-error").textContent = error.message;
  }
});
$("#logout").addEventListener("click", () => {
  token = "";
  sessionStorage.removeItem("omnisec_token");
  showLogin();
});

async function refreshOverview() {
  try {
    const data = await api("/api/overview");
    $("#stat-agents").textContent = data.agents;
    $("#stat-divisions").textContent = data.divisions;
    $("#stat-tasks").textContent = data.tasks;
    $("#stat-audit").textContent = data.audit.valid ? "VALID" : "CHECK";
    $("#audit-sub").textContent = data.audit.entries + " verified ledger events";
    $("#recent-tasks").innerHTML = data.recentTasks.length ? data.recentTasks.map(task => `<div class="task-row"><strong>${escapeHtml(task.title)}</strong><small>${escapeHtml(task.status)} · ${new Date(task.createdAt).toLocaleString()}</small></div>`).join("") : "No research tasks yet.";
  } catch (error) { toast(error.message); }
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}
async function loadTasks() {
  try {
    const { tasks } = await api("/api/tasks");
    if (tasks.length) $("#recent-tasks").innerHTML = tasks.slice(0, 5).map(task => `<div class="task-row"><strong>${escapeHtml(task.title)}</strong><small>${escapeHtml(task.status)} · ${new Date(task.createdAt).toLocaleString()}</small></div>`).join("");
  } catch (error) { toast(error.message); }
}
$("#task-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  $("#task-error").textContent = "";
  $("#task-result").classList.add("hidden");
  const payload = {
    objective: $("#objective").value,
    scope: $("#scope").value,
    notes: $("#notes").value,
    authorised: $("#authorised").checked
  };
  try {
    const { task } = await api("/api/tasks", { method: "POST", body: JSON.stringify(payload) });
    activeTaskId = task.id;
    $("#task-result").classList.remove("hidden");
    $("#task-result").innerHTML = `<p class="eyebrow">TASK CREATED · ${escapeHtml(task.id.slice(0, 8))}</p><h4>${escapeHtml(task.title)}</h4><p>${escapeHtml(task.result.summary)}</p><strong>Assigned specialists</strong><p>${task.assignedAgents.map(agent => escapeHtml(agent.name)).join(" · ")}</p><strong>Research workflow</strong><ol>${task.workflow.map(step => `<li>${escapeHtml(step.name)} — ${escapeHtml(step.description)}</li>`).join("")}</ol><strong>Current limitations</strong><ul>${task.result.limitations.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul><button id="run-analysis" class="primary">Run AI multi-agent analysis →</button><div id="analysis-output"></div><div id="survival-handoff" class="form-card hidden"><label for="handoff-domain">Send this cyber-intelligence brief to Survival AI</label><select id="handoff-domain"><option value="trading">Traditional trading risk</option><option value="crypto">Crypto market risk</option></select><p class="tiny">GENESIS findings are AI-derived hypotheses, not verified market facts. Survival AI will independently assess them and may return WAIT or RESEARCH.</p><button id="send-handoff" class="secondary" type="button">Ask Survival AI to assess this intelligence →</button><div id="handoff-result"></div></div>`;
    $("#run-analysis").addEventListener("click", async () => {
      const button = $("#run-analysis");
      button.disabled = true;
      button.textContent = "Analysing with specialist agents…";
      try {
        const analysed = await api("/api/tasks/" + activeTaskId + "/analyze", { method: "POST", body: "{}" });
        const report = analysed.task.analysis;
        $("#analysis-output").innerHTML = `<h4>Specialist research</h4>${report.specialistReports.map(item => `<article class="audit-event"><strong>${escapeHtml(item.agentName)}</strong><pre>${escapeHtml(JSON.stringify(item.report, null, 2))}</pre></article>`).join("")}<h4>Independent verification</h4><pre>${escapeHtml(JSON.stringify(report.independentVerification, null, 2))}</pre><p class="tiny">${escapeHtml(report.disclaimer)}</p>`;
        $("#survival-handoff").classList.remove("hidden");
        $("#send-handoff").addEventListener("click", async () => {
          const handoff = $("#send-handoff");
          handoff.disabled = true;
          handoff.textContent = "Survival AI is assessing the brief…";
          $("#handoff-result").textContent = "";
          try {
            const assessed = await api("/api/tasks/" + activeTaskId + "/send-to-survival", {
              method: "POST",
              body: JSON.stringify({ domain: $("#handoff-domain").value })
            });
            const r = assessed.report;
            $("#handoff-result").innerHTML = `<h4>Survival AI assessment: ${escapeHtml(r.decision)}</h4><p>${escapeHtml(r.summary)}</p><p><strong>Confidence:</strong> ${Math.round(Number(r.confidence || 0) * 100)}%</p><p><strong>Evidence:</strong> ${r.evidence_count} item(s) from ${r.independent_source_count} source(s). GENESIS report is currently AI-derived and not independently sourced.</p><p><strong>Risk flags</strong></p><ul>${(r.risk_flags || []).map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul><p><strong>Evidence gaps</strong></p><ul>${(r.evidence_gaps || []).map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul><p class="tiny">Execution allowed: no · Live money allowed: no</p>`;
            toast("Survival AI assessed the GENESIS intelligence brief.");
          } catch (error) { $("#handoff-result").textContent = error.message; }
          finally { handoff.disabled = false; handoff.textContent = "Ask Survival AI to assess this intelligence →"; }
        });
        button.textContent = "Analysis complete";
        toast("AI research and independent verification completed.");
        refreshOverview();
      } catch (error) {
        button.disabled = false;
        button.textContent = "Run AI multi-agent analysis →";
        $("#analysis-output").textContent = error.message;
      }
    });
    $("#task-form").reset();
    toast("Research plan created.");
    refreshOverview();
  } catch (error) { $("#task-error").textContent = error.message; }
});
async function loadSurvivalStatus() {
  const status = $("#survival-status");
  status.textContent = "Checking Survival AI bridge…";
  try {
    const data = await api("/api/survival/status");
    if (!data.configured) status.textContent = "Not configured. Add SURVIVAL_AI_BASE_URL and SURVIVAL_AI_INTEGRATION_TOKEN to the GENESIS service environment.";
    else if (!data.connected) status.textContent = "Bridge settings are present, but Survival AI is not reachable: " + (data.error || "connection failed");
    else status.textContent = "Connected to Survival AI · " + data.remote.model_mode + " · durable research memory · no execution authority.";
  } catch (error) { status.textContent = error.message; }
}
$("#survival-refresh").addEventListener("click", loadSurvivalStatus);
$("#survival-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  $("#survival-error").textContent = "";
  $("#survival-result").classList.add("hidden");
  let evidence, context;
  try {
    evidence = JSON.parse($("#survival-evidence").value || "[]");
    context = JSON.parse($("#survival-context").value || "{}");
    if (!Array.isArray(evidence)) throw new Error("Evidence must be a JSON array.");
    if (!context || typeof context !== "object" || Array.isArray(context)) throw new Error("Context must be a JSON object.");
  } catch (error) { $("#survival-error").textContent = "Invalid JSON: " + error.message; return; }
  const button = $("#survival-form button[type=submit]");
  button.disabled = true;
  button.textContent = "Running Survival AI analysis…";
  try {
    const result = await api("/api/survival/analyze", { method: "POST", body: JSON.stringify({
      domain: $("#survival-domain").value, goal: $("#survival-goal").value, evidence, context
    }) });
    const report = result.report;
    $("#survival-result").classList.remove("hidden");
    $("#survival-result").innerHTML = `<p class="eyebrow">SURVIVAL AI · ${escapeHtml(report.domain)}</p><h4>${escapeHtml(report.decision)} · Confidence ${Math.round(Number(report.confidence || 0) * 100)}%</h4><p>${escapeHtml(report.summary)}</p><strong>Rationale</strong><p>${escapeHtml(report.rationale)}</p><strong>Risk flags</strong><ul>${(report.risk_flags || []).map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul><strong>Evidence gaps</strong><ul>${(report.evidence_gaps || []).map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul><strong>Next steps</strong><ul>${(report.next_steps || []).map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul><p class="tiny">Model-backed: ${report.model_backed === true ? "yes" : "no"} · Execution authority: none · Live-money permission: false</p><details><summary>Full structured report</summary><pre>${escapeHtml(JSON.stringify(report, null, 2))}</pre></details>`;
    toast("Survival AI analysis completed.");
  } catch (error) { $("#survival-error").textContent = error.message; }
  finally { button.disabled = false; button.textContent = "Run Survival AI analysis →"; }
});

let cachedAgents = [];
async function loadAgents() {
  try {
    const data = await api("/api/agents");
    cachedAgents = data;
    renderAgents("");
  } catch (error) { toast(error.message); }
}
function renderAgents(query) {
  const needle = query.toLowerCase();
  $("#agent-groups").innerHTML = cachedAgents.divisions.map(division => {
    const agents = cachedAgents.agents.filter(agent => agent.division === division.name && (agent.name + agent.id + agent.mission).toLowerCase().includes(needle));
    if (!agents.length) return "";
    return `<div class="division"><div class="division-head"><strong>${escapeHtml(division.name)}</strong><span class="subtle">${agents.length} agents</span></div><div class="agent-grid">${agents.map(agent => `<article class="agent"><code>${escapeHtml(agent.id)}</code><b>${escapeHtml(agent.name)}</b><p>${escapeHtml(agent.mission)}</p><small>● READY · RESEARCH ONLY</small></article>`).join("")}</div></div>`;
  }).join("");
}
$("#agent-search").addEventListener("input", event => renderAgents(event.target.value));
async function loadAudit() {
  try {
    const data = await api("/api/audit");
    $("#audit-status").textContent = data.verification.valid ? `✓ Hash chain valid · ${data.verification.entries} entries` : "⚠ Audit integrity check failed.";
    $("#audit-events").innerHTML = data.events.map(event => `<article class="audit-event"><strong>${escapeHtml(event.type)}</strong><small>${escapeHtml(event.timestamp)} · #${event.sequence}</small><code>hash: ${escapeHtml(event.hash)}</code></article>`).join("") || "No events.";
  } catch (error) { toast(error.message); }
}
$("#verify-audit").addEventListener("click", loadAudit);

(async function init() {
  try {
    const health = await fetch("/api/health").then(response => response.json());
    if (!health.accessConfigured) {
      $("#login-error").textContent = "Server setup required: configure OMNISEC_APP_PASSWORD and OMNISEC_SESSION_SECRET.";
      $("#password").disabled = true;
      $("#login-form button").disabled = true;
      return;
    }
    if (token) showApp();
    else showLogin();
  } catch {
    $("#login-error").textContent = "Unable to connect to the OMNISEC server.";
  }
})();