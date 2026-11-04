const $ = (selector) => document.querySelector(selector);
let token = sessionStorage.getItem("omnisec_token") || "";

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
  $("#view-title").textContent = ({ overview: "Overview", research: "Research tasks", agents: "Agent network", audit: "Audit ledger" })[name];
  if (name === "agents") loadAgents();
  if (name === "audit") loadAudit();
  if (name === "research") loadTasks();
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
    $("#task-result").classList.remove("hidden");
    $("#task-result").innerHTML = `<p class="eyebrow">TASK CREATED · ${escapeHtml(task.id.slice(0, 8))}</p><h4>${escapeHtml(task.title)}</h4><p>${escapeHtml(task.result.summary)}</p><strong>Assigned specialists</strong><p>${task.assignedAgents.map(agent => escapeHtml(agent.name)).join(" · ")}</p><strong>Research workflow</strong><ol>${task.workflow.map(step => `<li>${escapeHtml(step.name)} — ${escapeHtml(step.description)}</li>`).join("")}</ol><strong>Current limitations</strong><ul>${task.result.limitations.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
    $("#task-form").reset();
    toast("Research plan created.");
    refreshOverview();
  } catch (error) { $("#task-error").textContent = error.message; }
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