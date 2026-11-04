import test from "node:test";
import assert from "node:assert/strict";
import { getKevCatalog, getCveIntelligence } from "../lib/threat-intel.js";
const response = data => ({ ok: true, status: 200, headers: { get: () => "application/json" }, text: async () => JSON.stringify(data) });

test("KEV retrieval filters and bounds results with source provenance", async () => {
  const fetchImpl = async url => {
    assert.equal(new URL(url).hostname, "www.cisa.gov");
    return response({ catalogVersion: "test", dateReleased: "2026-11-04", vulnerabilities: [
      { cveID: "CVE-2025-1111", vendorProject: "Example", product: "Portal", vulnerabilityName: "Portal RCE", dateAdded: "2025-01-01", dueDate: "2025-02-01", shortDescription: "Remote code execution", requiredAction: "Patch", knownRansomwareCampaignUse: "Unknown" },
      { cveID: "CVE-2025-2222", vendorProject: "Other", product: "Agent", vulnerabilityName: "Agent issue", shortDescription: "Local issue" }
    ] });
  };
  const result = await getKevCatalog({ query: "portal", limit: 1, fetchImpl });
  assert.equal(result.total_catalog_entries, 2);
  assert.equal(result.matching_entries, 1);
  assert.equal(result.items[0].cve_id, "CVE-2025-1111");
  assert.equal(result.source.publisher, "CISA");
});

test("CVE lookup rejects malformed identifiers before fetching", async () => {
  let called = false;
  await assert.rejects(() => getCveIntelligence("not-a-cve", { fetchImpl: async () => { called = true; } }), /valid CVE identifier/);
  assert.equal(called, false);
});

test("CVE lookup preserves NVD data and tolerates partial EPSS failure", async () => {
  const fetchImpl = async url => {
    if (new URL(url).hostname === "services.nvd.nist.gov") return response({ vulnerabilities: [{ cve: {
      vulnStatus: "Analyzed", published: "2025-01-01T00:00:00.000", lastModified: "2025-01-02T00:00:00.000",
      descriptions: [{ lang: "en", value: "Example vulnerability" }],
      metrics: { cvssMetricV31: [{ cvssData: { version: "3.1", baseScore: 9.8, baseSeverity: "CRITICAL" } }] },
      weaknesses: [{ description: [{ lang: "en", value: "CWE-79" }] }],
      references: [{ url: "https://vendor.example/advisory", tags: ["Vendor Advisory"] }]
    } }] });
    throw new Error("EPSS temporarily unavailable");
  };
  const result = await getCveIntelligence("cve-2025-12345", { fetchImpl });
  assert.equal(result.cve_id, "CVE-2025-12345");
  assert.equal(result.vulnerability.cvss.base_score, 9.8);
  assert.equal(result.exploitation_probability, null);
  assert.equal(result.sources[1].status, "unavailable");
  assert.equal(result.errors.length, 1);
});
