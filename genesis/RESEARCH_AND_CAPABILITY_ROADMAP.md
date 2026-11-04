# OMNISEC GENESIS — research-backed capability roadmap

**Research snapshot:** 4 November 2026  
**Scope:** defensive cybersecurity research, authorised security validation, AI-agent security, and verified intelligence handoff to Survival AI.

## Executive decision

Do not make GENESIS a collection of loosely connected chat personas. Build a constrained, evidence-grounded agent system with:
1. a policy-enforcing orchestrator;
2. specialist analysis roles;
3. read-only, provenance-preserving research connectors;
4. an isolated lab adapter for explicitly authorised assets;
5. independent verification and confidence calibration;
6. a compact, structured intelligence brief for Survival AI;
7. repeatable evaluations and regression gates.

The 45 specialist entries in the current registry are role definitions, not 45 independently trained or concurrently running models. The present GENESIS model integration uses a single configured model for a limited number of specialist prompts and a verifier. Model quality, tool quality, data quality and evaluation quality—not the agent count—determine capability.

## Research findings and engineering implications

### 1. Agent security is an architectural problem
The Frontier Model Forum's *Emerging Security Practices for AI Agents* describes the expanded attack surface created by model reasoning, external tools, memory and delegation. It recommends vetted tools, sandboxing untrusted integrations, adaptive least privilege and adversarial evaluation.

Engineering decision: every tool must have a typed schema, explicit capability, allowlisted destinations, bounded arguments, timeouts and an independent policy check. Agents cannot grant themselves permissions or delegate unrestricted privileges.

### 2. Prompt injection and tool poisoning must be first-class tests
MITRE ATLAS documents attacks against AI systems including direct and indirect prompt injection, malicious tool descriptions, data exfiltration via tool invocation and data destruction. OWASP's 2026 Agentic Applications Top 10 provides a current taxonomy for agentic-system risk.

Engineering decision: treat web pages, advisories, repository content, PDFs, tickets and tool outputs as untrusted data—not instructions. Keep policy outside model context, validate all tool calls in deterministic code, redact secrets, and test malicious instructions embedded in retrieved documents.

### 3. Human oversight and least privilege are required for high-impact tools
The Canadian Centre for Cyber Security guidance on careful adoption of agentic AI recommends explicit control flows, human approval for high-risk actions, auditable and reversible operations, tool allowlists, role separation, and graduated autonomy.

Engineering decision: start with read-only public-source research and static code analysis. Any active validation must use a separately provisioned lab or explicitly allowlisted owned asset, with a written scope, expiry, rate limits, safe test profiles, and a human approval gate. No public-target exploitation, stealth, persistence, credential collection, log wiping or unapproved lateral movement.

### 4. Agent performance must be measured, not asserted
Anthropic's research on effective agents and agent evaluations emphasizes ground-truth feedback, clear tool interfaces, task-specific evals, regression tests, cost/latency tracking and human review. OpenAI's Agents SDK documents handoffs, guardrails and structured tracing. LangGraph documents checkpointing and resumable workflows.

Engineering decision: use task-specific test suites, held-out scenarios, exact source checks, deterministic policy tests, human scoring, and tracked model/cost/latency metrics. A model upgrade is not automatically an improvement; compare it on the same evaluation set.

### 5. Cybersecurity benchmarks suggest a realistic evaluation programme
Relevant research includes:
- CyberSecEval 2 (arXiv:2404.13161): evaluates cybersecurity model risks including prompt injection and code-interpreter abuse.
- InjecAgent (arXiv:2403.02691): evaluates indirect prompt injection against tool-integrated agents.
- Agent Security Bench (arXiv:2410.02644): evaluates attack and defence behaviour across multiple agent scenarios.
- CyberGym (arXiv:2506.02548): evaluates vulnerability understanding and reproduction against real-world vulnerability/code pairs.
- CyberSOCEval (search by exact title before adoption): evaluates malware-analysis and threat-intelligence reasoning.
- Cybersecurity AI Benchmark / CAIBench (arXiv:2510.24317): studies broader cybersecurity agent capability across task categories.

These are research benchmarks, not certifications or proof that a model is safe. Review licensing, task definitions, dataset provenance and permitted use before importing any benchmark corpus. Use non-destructive, isolated subsets first.

## Target architecture

### GENESIS (stateless research and validation orchestrator)
- Receives a scoped question and authorised context.
- Selects a small number of specialist roles based on task needs.
- Retrieves current public advisories and vendor disclosures through allowlisted read-only connectors.
- Preserves source URL, publisher, publication time, retrieval time, affected product/version, advisory/CVE identifiers and exact supporting excerpts.
- Separates confirmed facts, source claims, model inference and unknowns.
- Sends a structured brief to Survival AI only after verification and operator approval.
- Does not maintain durable personal memory. Temporary task state has an explicit retention window and is discarded on completion; operational security records remain protected and access-controlled.

### Safe validation environment
Future lab adapter, not currently implemented:
- Isolated disposable virtual machines/containers with no route to public networks by default.
- Synthetic credentials and synthetic data only.
- Preloaded intentionally vulnerable applications and benchmark fixtures.
- Egress deny-by-default, CPU/memory/time quotas, read-only host mounts, no host Docker socket, no cloud metadata access.
- Only non-destructive checks and approved proof-of-concept validation profiles.
- Snapshot/reset after a test, preserving a minimal test report and integrity metadata.
- A human approval record before any test begins.

### Survival AI (financial analysis and risk owner)
- Accepts GENESIS briefs as hypotheses, not ground truth.
- Independently retrieves market, issuer, exchange and on-chain evidence.
- Checks timestamp alignment, asset identity, causal relevance, source independence, liquidity, volatility, spread, slippage and funding/basis where relevant.
- Produces a recommendation with thesis, evidence, confidence, invalidation conditions, time horizon and risk flags.
- GENESIS cannot send orders, change broker settings, sign transactions or move funds.
- A single GENESIS-generated report is one source and cannot satisfy Survival AI's multi-source evidence thresholds.

## Intelligence brief contract

Every future GENESIS → Survival AI brief should contain:
- `schema_version`, `brief_id`, `created_at`, `expires_at`
- `scope`, `authorised_methods`, `task_id`
- `claims[]`: claim text, claim type (fact/source-claim/inference), confidence, affected entity, product/version, event time
- `sources[]`: canonical URL, publisher, publication date, retrieval date, source type, exact supporting passage or advisory identifier
- `corroboration`: independent source count, contradictions, source independence assessment
- `market_relevance`: possible exposure channel, affected assets/entities, uncertainty, alternative explanations
- `verification`: supported claims, disputed claims, missing evidence, verifier result
- `limitations`, `recommended_follow_up`
- `execution_authority: none`

Reject expired briefs, missing provenance, malformed source URLs, claims without evidence, and any request to execute financial actions.

## Capability milestones

### M0 — Existing foundation
- 45 role registry; policy and task routing; user-triggered model analysis; verifier; dashboard; authenticated analysis-only Survival AI bridge.
- Current limitations: one configured model, limited specialist prompts, no autonomous source retrieval, in-memory GENESIS task/audit state.

### M1 — Evidence-grounded public threat intelligence
- **Partially implemented on the GENESIS draft branch:** authenticated read-only CISA KEV catalog search plus NIST NVD and FIRST EPSS CVE enrichment, with publisher URLs, publication/score dates, retrieval timestamps, allowlisted HTTPS endpoints, time/size bounds, rate limits and partial-source error reporting.
- Remaining: vendor PSIRTs/advisories, CERT/CC and trusted public incident reports, source independence scoring and corroboration.
- Deduplication by CVE/advisory ID and canonical URL.
- Source timestamps and provenance; no scraped page instructions can alter policy.
- Human review for low-confidence or conflicting claims.

### M2 — Evaluation harness
- Prompt-injection corpus, tool misuse cases, scope-escape tests, false-positive tests, source-citation checks, CVE/product matching, confidence calibration.
- Regression suite on every code or model change.
- Track precision, recall, evidence coverage, false-positive rate, unsafe tool-call rate, cost, latency and human override rate.

### M3 — Isolated authorised security lab
- Separate lab service with disposable targets, no public egress by default, explicit asset allowlists, strict time/resource quotas, snapshots and reset.
- Static analysis and safe configuration checks first. Dynamic tests only against intentionally vulnerable fixtures or owned systems under explicit approval.
- Never add stealth, log deletion, persistence, credential theft or public exploitation.

### M4 — Better model selection and specialist diversity
- Evaluate candidate models on the same held-out tasks. Consider model capability, structured output reliability, source fidelity, prompt-injection robustness, tool-call discipline, latency, price, availability and data-retention terms.
- Use different models only where measured improvement justifies added cost and complexity.
- Use a deterministic verifier and optional second-model critique for consequential findings; do not confuse multiple prompts to one model with independent model consensus.

### M5 — Production hardening
- Persistent GENESIS job queue only if needed; minimal metadata, explicit retention and deletion policy, encrypted secrets, managed identity, durable audit trail with access controls and integrity checks.
- Separate service identities and credentials per application.
- Circuit breakers, retries with idempotency, quotas, health checks, backups and incident response runbooks.

## Initial acceptance criteria

Do not call GENESIS production-ready until:
1. All tool calls are validated outside the model and deny-by-default.
2. Prompt injection tests cannot trigger unauthorised tools or leak configured secrets.
3. Source claims have valid citations and correct product/version mapping.
4. The verifier can reject unsupported or contradictory findings.
5. Scope violations reliably stop execution.
6. Lab jobs cannot reach public targets or host secrets.
7. Survival AI rejects expired or unprovenanced briefs and preserves existing multi-source risk thresholds.
8. CI runs deterministic tests on every change and a held-out evaluation before model promotion.
9. No route grants GENESIS trading, wallet, payment or broker authority.

## Primary references

- Frontier Model Forum, *Emerging Security Practices for AI Agents*: https://www.frontiermodelforum.org/issue-briefs/emerging-security-practices-for-ai-agents/
- OWASP, *Top 10 for Agentic Applications 2026*: https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/
- MITRE ATLAS: https://atlas.mitre.org/
- Canadian Centre for Cyber Security, *Careful adoption of agentic AI*: https://www.cyber.gc.ca/en/guidance/careful-adoption-agentic-ai
- NIST AI RMF: https://www.nist.gov/itl/ai-risk-management-framework
- OpenAI Agents documentation: https://developers.openai.com/api/docs/guides/agents
- Anthropic, *Building effective agents*: https://www.anthropic.com/research/building-effective-agents
- Anthropic, *Demystifying evals for AI agents*: https://www.anthropic.com/research/demystifying-evals-for-ai-agents
- Anthropic, *How we built our multi-agent research system*: https://www.anthropic.com/research/multi-agent-research-system
- LangGraph checkpointing: https://docs.langchain.com/oss/javascript/langgraph/checkpointers
- CyberSecEval 2: https://arxiv.org/abs/2404.13161
- InjecAgent: https://arxiv.org/abs/2403.02691
- Agent Security Bench: https://arxiv.org/abs/2410.02644
- CyberGym: https://arxiv.org/abs/2506.02548
- CAIBench: https://arxiv.org/abs/2510.24317

## Research limitations

This roadmap is a synthesis of public documentation and paper metadata, not a full reproduction of every benchmark. Some papers are preprints and their claims require independent replication. No third-party model weights or proprietary source code are copied into GENESIS. Before implementing a framework or benchmark, check its current release, license, security posture and dependency chain.
\n\n## Implementation update — 4 November 2026\n\nThe first M1 slice has been added to the separate GENESIS draft branch. See `USE_LIVE_INTELLIGENCE.md` for the Render deployment and operator walkthrough. It is saved but not merged or deployed. The latest commit still requires CI confirmation; no green check is claimed for the newest code. The matching Survival AI bridge remains a separate draft PR.\n