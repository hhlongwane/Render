import { randomUUID } from "node:crypto";
import { AGENTS } from "./agents.js";

const ROUTES = [
  { pattern: /network|dns|firewall|routing|vpn|protocol/i, ids: ["A01","A02","A05","F03","F05"] },
  { pattern: /windows|linux|android|ios|mobile|device|firmware|hardware/i, ids: ["A04","C01","C02","C03","C04","C05","F05"] },
  { pattern: /web|website|application|source code|code review|dependency|package|software|api/i, ids: ["B01","B02","B03","B04","D04","G06","F05"] },
  { pattern: /cloud|aws|azure|gcp|kubernetes|container|microservice|infrastructure/i, ids: ["A02","D01","D05","G05","G11","F05"] },
  { pattern: /crypto|encryption|tls|certificate|key management|quantum|authentication|oauth|identity/i, ids: ["E01","E02","E03","E04","G11","G13","F05"] },
  { pattern: /ai|agent|model|llm|prompt injection|hugging|hugging face/i, ids: ["G03","G04","G05","G12","G15","F03","F05"] },
  { pattern: /incident|malware|forensic|log|trace|evidence|breach|threat/i, ids: ["F01","F02","F03","F04","G01","G07","G08","G14","G15"] }
];

const DEFAULT_IDS = ["A02","B02","F03","F05","G12","G15"];

export function createResearchTask({ objective, scope, notes }) {
  const text = [objective, notes].join(" ");
  const selected = new Set(DEFAULT_IDS);
  for (const route of ROUTES) if (route.pattern.test(text)) route.ids.forEach(id => selected.add(id));
  const agents = AGENTS.filter(agent => selected.has(agent.id));
  const id = randomUUID();

  return {
    id,
    title: objective.length > 88 ? objective.slice(0, 85) + "..." : objective,
    objective,
    scope,
    notes,
    mode: "controlled-research",
    status: "planned",
    createdAt: new Date().toISOString(),
    assignedAgents: agents.map(({ id, name, division }) => ({ id, name, division })),
    workflow: [
      { step: 1, name: "Scope validation", description: "Confirm ownership, permission, supplied evidence and research boundaries.", status: "ready" },
      { step: 2, name: "Knowledge retrieval", description: "Identify relevant standards, advisories and historical lessons.", status: "queued" },
      { step: 3, name: "Specialist analysis", description: "Route the question to the selected specialist agents.", status: "queued" },
      { step: 4, name: "Defensive assessment", description: "Identify risks, controls, evidence gaps and safe validation options.", status: "queued" },
      { step: 5, name: "Independent verification", description: "Challenge claims and distinguish evidence from assumptions.", status: "queued" },
      { step: 6, name: "Research report", description: "Produce findings, confidence, limitations and remediation priorities.", status: "queued" }
    ],
    result: {
      summary: "Research plan created. No target was contacted and no tests or commands were executed.",
      findings: [],
      limitations: [
        "This first build creates an agent-routed research plan; it does not yet call external AI model APIs.",
        "No network scanning, exploitation, credential access, shell execution or evidence modification is available.",
        "Task and audit records are currently held in process memory and reset when the server restarts."
      ]
    }
  };
}
