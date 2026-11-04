# Use GENESIS Live Intelligence

This guide applies after PR #3 is reviewed, merged and deployed. The dashboard code is saved on `genesis-foundation` but is not live yet.

## Review before merge
- GENESIS: https://github.com/hhlongwane/Render/pull/3
- Separate Survival AI bridge: https://github.com/hhlongwane/survival-ai/pull/57

Review the full diff and wait for green CI. PR #3 currently has no file deletions. Do not change unrelated Render services or project directories.

## Deploy as a separate Render service
1. Open https://dashboard.render.com/.
2. Choose **New → Web Service** and connect `hhlongwane/Render`.
3. Select the reviewed branch/commit after merge.
4. Set **Root Directory** to `genesis` (do not change an unrelated existing service).
5. Build command: `npm run check`
6. Start command: `npm start`

## Environment variables
Required:
- `OMNISEC_APP_PASSWORD`: unique random password, 16+ characters.
- `OMNISEC_SESSION_SECRET`: different random secret, 32+ characters.

Optional:
- `OPENAI_API_KEY`: only for user-triggered model-backed analysis.
- `OPENAI_MODEL`: model identifier supported by the configured account.
- `NVD_API_KEY`: optional NIST NVD key for improved request limits.
- `SURVIVAL_AI_BASE_URL` and `SURVIVAL_AI_INTEGRATION_TOKEN`: only after the matching Survival AI integration PR is reviewed, merged and deployed. Use a dedicated random token on both services.

Keep secrets in Render Environment settings, never in Git, browser code or research notes.

## Use the dashboard
1. Open the deployed GENESIS URL and sign in.
2. Select **Live intelligence**.
3. Search the CISA KEV catalog by vendor, product, CVE or keyword. A blank search returns the first catalog entries.
4. Select **Enrich with NVD + EPSS** on a result, or enter a CVE ID such as `CVE-2025-12345`.
5. Review publication/update dates, severity, EPSS score date, source status and publisher links.

## Interpret results correctly
- **CISA KEV** lists vulnerabilities known to have been exploited in the wild; it does not prove your system is affected.
- **NIST NVD** provides CVE descriptions, CVSS metrics, weakness identifiers and references where available.
- **FIRST EPSS** estimates the probability of exploitation in the next 30 days; it is not proof of exploitation.

Partial source failures are reported. This milestone retrieves public feeds only: it does not scan hosts, exploit vulnerabilities, access exchange accounts or execute trades. Vendor PSIRTs, CERT feeds, multi-source corroboration and isolated lab validation remain future milestones.

## Survival AI
The existing task handoff remains explicit and analysis-only. The new feed dashboard does not yet automatically convert a CVE into a trade recommendation. A future correlation layer must map verified incidents to affected assets, establish market relevance, and request human approval before sending a sourced brief to Survival AI.
