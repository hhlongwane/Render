# OMNISEC GENESIS — Foundation build

OMNISEC GENESIS is a controlled cybersecurity research workspace. This first implementation provides a 45-agent registry, deterministic task routing, explicit scope/authorisation checks, a session gate, and a hash-linked in-memory audit ledger.

## Current status

**Implemented**
- 45 specialist agent definitions across seven divisions.
- Research task creation and domain-based agent routing.
- Optional model-backed analysis using up to three specialist calls plus an independent verifier through the OpenAI Responses API.
- Explicit user-triggered analysis; task creation itself does not spend model tokens.
- Sign-in and analysis rate limits.
- Scope and explicit authorisation validation.
- Refusal of requests involving evidence destruction, intrusion concealment, credential theft, or unauthorised access.
- Session authentication using a server-side password and HMAC-signed, expiring token.
- Content Security Policy and baseline security headers.
- Hash-linked audit events and integrity verification.
- Responsive dashboard for overview, research tasks, agents and audit events.
- Automated unit tests.

**Not implemented yet**
- Continuous autonomous reasoning or independent model instances; the current multi-agent workflow uses one configured model in separate specialist roles.
- Live external vulnerability-feed retrieval.
- Persistent database storage.
- Retrieval from live vulnerability/advisory feeds.
- Real sandbox provisioning.
- Source-code upload and static analysis.
- Multi-user identity and role management.
- Production deployment and independent security review.

The current agent engine creates research plans. It does not claim that 45 independent AI models are running.

## Run locally

Requires Node.js 20+.

```bash
cd genesis
export OMNISEC_APP_PASSWORD='use-a-random-secret-at-least-16-characters'
export OMNISEC_SESSION_SECRET='use-a-different-random-secret-at-least-32-characters'
npm run check
npm start
```

Open http://localhost:3030.

For PowerShell, set the two variables with `$env:OMNISEC_APP_PASSWORD` and `$env:OMNISEC_SESSION_SECRET`.

## Deploy as a separate Render service

Create a new Web Service from this repository and set **Root Directory** to `genesis`.

- Build command: `npm run check`
- Start command: `npm start`
- Add `OMNISEC_APP_PASSWORD` (at least 16 characters).
- Add `OMNISEC_SESSION_SECRET` (at least 32 random characters). Add `OPENAI_API_KEY` and optionally `OPENAI_MODEL` to enable the user-triggered AI analysis feature. Each analysis uses up to four model requests and may incur provider charges.
- Set `NODE_ENV=production`.

Do not reuse credentials from other projects. Do not put secrets in GitHub or browser code. Task and audit data are currently in memory and will reset on restart; do not use this build for production or sensitive assessments.

## Security boundaries

This build supports research planning and defensive analysis only. It has no target scanner, exploit runner, stealth feature, log deletion, credential extraction, unrestricted shell, or mechanism for bypassing access controls. It does not connect to or test a target when a task is created.

## Next milestones

1. Add durable storage with tenant isolation and encrypted secrets.
2. Add a provider abstraction for model-backed specialist analysis with strict tool allowlists.
3. Add source-document ingestion with prompt-injection-resistant handling.
4. Add sourced incident and vulnerability intelligence retrieval.
5. Add disposable, network-isolated lab environments for defensive reproductions.
6. Add tamper-evident external audit export and independent monitoring.
7. Add benchmark suites, red-team evaluations and human-reviewed releases.


## Connect the separate Survival AI service

The GENESIS dashboard includes an optional **Survival AI** workspace. It calls only the dedicated analysis-only integration API; it does not access broker, wallet, payment, order, or account-management endpoints.

Configure these server-side environment variables on the GENESIS service:

- `SURVIVAL_AI_BASE_URL=https://survival-ai-gmd5.onrender.com`
- `SURVIVAL_AI_INTEGRATION_TOKEN`: the same dedicated random token configured as `SURVIVAL_AI_INTEGRATION_TOKEN` on the Survival AI service.

Never put the token in browser code or Git. Remote connections require HTTPS. After both branches are reviewed, merged and deployed, sign in to GENESIS, open **Survival AI**, and choose **Check connection**. The panel supports only trading, crypto and Shopify analysis and clearly reports when the upstream service is unavailable or running its local fallback.

The bridge does not grant GENESIS trading execution, wallet signing, payment, account access, or code-deployment authority. Existing Survival AI risk gates and financial records remain authoritative. See the Survival AI repository's `docs/GENESIS_INTEGRATION.md` for the matching service setup.


## GENESIS intelligence handoff to Survival AI

After a GENESIS specialist analysis completes, the operator can explicitly send its report to Survival AI using **Ask Survival AI to assess this intelligence**. The operator chooses `trading` or `crypto`; the GENESIS server forwards a compact brief to Survival AI's existing analysis-only reasoner.

The handoff includes the research task scope, specialist summaries, and the independent verifier's supported/disputed claims and evidence gaps. It labels the material as AI-derived and not independently sourced. Survival AI must treat it as a hypothesis, check it against its own market data and risk gates, and may return `WAIT` or `RESEARCH`. One GENESIS-generated brief is one evidence item from one source; it cannot satisfy the multi-source evidence thresholds for a paper test or prioritisation.

GENESIS does not retain a durable knowledge base. Its task and audit structures are process-memory only and reset when the service restarts; model calls use `store: false`. The handoff is explicit and operator-triggered. It does not execute trades, alter positions, move funds, or bypass Survival AI's existing decision gates.

**Current limitation:** GENESIS specialist analysis currently reasons over the user-supplied scope and notes. It does not autonomously browse, scan public systems, exploit targets, or discover private data. To make intelligence genuinely source-grounded, a future retrieval layer must ingest lawful public advisories, vendor disclosures and market data with timestamps, URLs, source identity and independent corroboration before forwarding claims as evidence.


## Research and capability roadmap

See [RESEARCH_AND_CAPABILITY_ROADMAP.md](RESEARCH_AND_CAPABILITY_ROADMAP.md) for the research synthesis, model/agent evaluation approach, safe authorised lab architecture, threat-intelligence source requirements, and staged implementation milestones. This is a roadmap, not a claim that live public-source retrieval or active lab testing is already implemented.
