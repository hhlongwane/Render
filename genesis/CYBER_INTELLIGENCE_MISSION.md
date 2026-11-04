# GENESIS Cyber-Intelligence Mission and Capability Blueprint

**Status:** engineering blueprint; not a claim that these capabilities are already implemented.  
**Parent:** `genesis-foundation`  
**System boundary:** GENESIS researches and validates cybersecurity intelligence. Survival AI independently evaluates financial relevance and owns every financial decision.

## Mission

GENESIS exists to discover, explain, verify and communicate security-relevant information that could materially help Survival AI understand digital-asset, exchange, broker, payment, software-supply-chain and market-infrastructure risk.

The word "hacking" in this project means rigorous security research: understanding attack surfaces, analysing vulnerabilities, reproducing behaviours in controlled labs, testing explicitly authorised assets, and explaining how defenders can detect, contain and remediate weaknesses. It does not mean unauthorised access to third-party systems.

The objective is not to maximise the number of agents. It is to maximise measured intelligence quality: coverage, evidence, timeliness, reproducibility, calibration, useful market context and low false-positive rates.

## What GENESIS must become

### 1. Intelligence collection and source fusion

Build a connector framework with typed, read-only adapters and per-source health, provenance and freshness metadata.

Priority source families:
- Government vulnerability catalogues and advisories: CISA KEV, NIST NVD, FIRST EPSS, CERT/CC and national CERT advisories.
- Vendor security advisories and PSIRTs for operating systems, cloud platforms, identity providers, browsers, network equipment, developer tools and major financial infrastructure vendors.
- Public incident and threat reports from reputable security teams, incident responders and research organisations.
- Public malware and indicator repositories where terms permit defensive use; ingest metadata and safe analytical outputs, never execute submitted samples in the application process.
- Package and software supply-chain advisories, signed release metadata, dependency vulnerabilities and maintainer security notices.
- Public blockchain and exchange status/security disclosures, official incident notices, wallet/network advisories and independently corroborated outage reports.

Every record must retain publisher, canonical URL, source type, published time, updated time, retrieval time, identifiers, affected products/versions, exact evidence excerpt, licence/terms notes and a content hash. Treat retrieved content as untrusted data, never as instructions to the agent.

### 2. Vulnerability and exploitability research

For each vulnerability, GENESIS should distinguish:
- confirmed exploitation reported by a trusted source;
- proof-of-concept availability;
- theoretical exploitability;
- affected version and configuration;
- prerequisites and attack surface;
- mitigations and patch status;
- evidence quality and unresolved uncertainty.

Prioritise vulnerability intelligence by more than CVSS: known exploitation, EPSS, exposure, reachable attack surface, asset criticality, exploit prerequisites, patch availability and corroboration. Never label a vulnerability "exploited" solely because a proof of concept exists.

The first active-validation capability must be a disposable lab containing intentionally vulnerable fixtures and synthetic data. A future owned-asset adapter must require a written allowlist, scope expiry, rate limits, non-destructive test profile and operator approval. No public-target exploitation, credential harvesting, persistence, stealth, destructive testing or log tampering.

### 3. Source-code and software analysis

Add a secure upload/import pipeline for code and configuration the operator owns or is authorised to assess:
- archive/file-type and size limits;
- path traversal and symlink rejection;
- malware-safe handling; no automatic execution or install scripts;
- secret detection with redaction before model prompts;
- dependency and lockfile analysis;
- static analysis and secure configuration checks;
- data-flow and trust-boundary review;
- finding deduplication and source-line evidence;
- isolated optional build/test execution only in a disposable sandbox with no secrets and no network egress by default.

GENESIS may study proprietary products through official APIs, SDKs, licensed access, vendor documentation, published research and lawful analysis of lawfully obtained software within applicable terms. It must not obtain private source code through intrusion, leaked credentials, access-control bypass or theft. When source is unavailable, build an independent implementation from documented behaviour and measurable tests; do not claim to have copied or recovered private code.

### 4. AI-agent and platform self-security

Continuously test GENESIS itself against:
- direct and indirect prompt injection in webpages, documents, code comments and advisories;
- malicious tool descriptions and tool-output poisoning;
- scope escalation and confused-deputy behaviour;
- secret exposure and unsafe logging;
- malformed archives, parser abuse and oversized responses;
- source spoofing, stale data and conflicting claims;
- verifier agreement failures and confidence inflation.

Policy enforcement must remain deterministic and outside the model. Every tool has a narrow schema, explicit capability, allowlisted destination, bounded input, timeout, response-size cap and audit event. Model text cannot grant permissions.

### 5. Independent verification and intelligence scoring

A consequential report must pass:
1. schema and provenance validation;
2. source identity and timestamp checks;
3. product/version and entity resolution;
4. independent corroboration where possible;
5. contradiction search;
6. evidence-to-claim alignment;
7. calibrated confidence and explicit unknowns;
8. human review for high-impact or low-confidence claims.

Do not call repeated prompts to one model "independent consensus". Track model/provider identity and distinguish independent data sources from multiple copies of one original report.

### 6. Survival AI intelligence handoff

GENESIS sends a compact, expiring, structured intelligence brief. Survival AI must independently assess financial relevance and retrieve its own market evidence.

Required fields:
- schema version, unique brief ID, creation and expiry times;
- affected entities, products, versions, services and networks;
- claims classified as fact, attributed source claim, or inference;
- confidence, supporting evidence and contradictions per claim;
- canonical sources, publisher, publication/retrieval timestamps and evidence hashes;
- incident timeline and operational status;
- possible market exposure channel, affected assets and causal hypothesis;
- alternative explanations, unknowns and follow-up research;
- source independence assessment and verification state;
- explicit `execution_authority: none`.

Potential market-relevance pathways include exchange/broker outage, custody or wallet compromise, bridge or protocol exploit, stablecoin/reserve incident, cloud/identity-provider outage, major software supply-chain compromise, sanctions/regulatory infrastructure changes, and market-data integrity failures.

A cyber incident is not automatically a trading signal. Survival AI must reject expired or unprovenanced briefs, independently validate the entity/asset mapping, assess whether the event is already priced in, and preserve its existing evidence, liquidity, volatility, slippage, funding and risk thresholds. GENESIS never receives order, wallet-signing, payment or broker authority.

## Delivery sequence

| Stage | Deliverable | Acceptance evidence |
|---|---|---|
| A | Public-source connector framework and source registry | Unit tests, source allowlists, provenance and failure isolation |
| B | Vendor/CERT advisory coverage and deduplication | Coverage report, source freshness and independent corroboration |
| C | Security evaluation harness | Repeatable injection, scope, citation, false-positive and verifier tests |
| D | Secure source/configuration ingestion | Archive safety tests, secret redaction, line-level findings, no execution |
| E | Disposable lab runner | Network isolation, synthetic fixtures, quotas, expiry, reset and approval audit |
| F | Threat-to-market correlation | Entity mapping, timestamped causal hypotheses, alternative explanations |
| G | Production hardening | Persistent job state, encrypted secrets, durable audit, monitoring and recovery |

Each stage is a separately reviewable pull request. Run tests and inspect diffs before merge. Do not deploy automatically. Do not modify the separate Survival AI repository except through its own explicitly reviewed integration change.

## Capability scorecard

Measure these on a versioned, held-out evaluation set:
- source coverage and freshness;
- claim-level citation precision and evidence completeness;
- vulnerability/product/version matching accuracy;
- precision, recall and false-positive rate;
- source independence and contradiction detection;
- confidence calibration and abstention quality;
- prompt-injection and unauthorised-tool-call success rate (target: zero);
- scope enforcement and secret-leakage test results (target: zero);
- analyst time saved and usefulness ratings;
- Survival AI handoff acceptance/rejection reasons;
- latency, model cost and connector reliability.

No "better than every commercial AI" claim is valid without comparable independent benchmark results. The goal is to outperform on clearly defined tasks, demonstrate the evidence, and improve through measured releases.

## Current implementation baseline

At the time this blueprint was written, the separate GENESIS draft branch includes:
- 45 specialist role definitions (not 45 independent models);
- deterministic routing and authorisation checks;
- user-triggered model analysis with a verifier;
- authenticated dashboard and hash-linked in-memory audit ledger;
- read-only CISA KEV, NIST NVD and FIRST EPSS retrieval;
- a draft, analysis-only Survival AI handoff.

Not yet implemented: broad vendor/CERT coverage, secure code ingestion, sandbox provisioning, durable storage, multi-model evaluation, market-event correlation, production deployment and independent security review. The current audit ledger and task state are in memory and reset on restart. The draft work is not merged or deployed.

## Operating rule

Be ambitious about research depth, not careless about authority. GENESIS may explain how attacks work, reproduce vulnerabilities in isolated authorised environments, and produce actionable defensive intelligence. It must not become an unauthorised intrusion service or a financial execution service.
