import test from "node:test";
import assert from "node:assert/strict";
import { AGENTS, DIVISIONS } from "../lib/agents.js";
import { createResearchTask } from "../lib/engine.js";
import { validateResearchRequest } from "../lib/policy.js";
import { AuditLedger } from "../lib/audit.js";

test("registry contains 45 agents across seven divisions", () => {
  assert.equal(AGENTS.length, 45);
  assert.equal(DIVISIONS.length, 7);
  assert.equal(new Set(AGENTS.map(agent => agent.id)).size, 45);
});

test("research task routes relevant specialists and does not execute a target", () => {
  const task = createResearchTask({
    objective: "Review my cloud API authentication design and access controls",
    scope: "My local test API and supplied architecture notes",
    notes: ""
  });
  assert.ok(task.assignedAgents.some(agent => agent.id === "D01"));
  assert.ok(task.assignedAgents.some(agent => agent.id === "D02"));
  assert.equal(task.status, "planned");
  assert.match(task.result.summary, /No target was contacted/);
});

test("policy requires explicit authorisation and rejects evidence destruction", () => {
  const missing = validateResearchRequest({ objective: "Review a test API security design", scope: "My local lab only", authorised: false });
  assert.equal(missing.ok, false);
  const unsafe = validateResearchRequest({ objective: "Erase logs and leave no traces", scope: "My lab environment", authorised: true });
  assert.equal(unsafe.ok, false);
});

test("audit ledger verifies append-only hash chain", () => {
  const ledger = new AuditLedger();
  ledger.append("system.started", { version: "test" });
  ledger.append("research.task.created", { taskId: "abc" });
  assert.equal(ledger.verify().valid, true);
  assert.equal(ledger.verify().entries, 2);
});
