const CISA_KEV_URL = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json";
const NVD_API = "https://services.nvd.nist.gov/rest/json/cves/2.0";
const EPSS_API = "https://api.first.org/data/v1/epss";
const MAX_RESPONSE_BYTES = 2_000_000;
const CVE_PATTERN = /^CVE-\\d{4}-\\d{4,}$/i;

async function fetchJson(url, { fetchImpl = fetch, headers = {} } = {}) {
  const parsed = new URL(url);
  const allowed = parsed.hostname === "www.cisa.gov" && parsed.pathname === "/sites/default/files/feeds/known_exploited_vulnerabilities.json"
    || parsed.hostname === "services.nvd.nist.gov" && parsed.pathname === "/rest/json/cves/2.0"
    || parsed.hostname === "api.first.org" && parsed.pathname === "/data/v1/epss";
  if (!allowed || parsed.protocol !== "https:" || parsed.username || parsed.password) {
    throw new Error("Threat-intelligence source is not on the approved public-source allowlist.");
  }
  const response = await fetchImpl(parsed, {
    method: "GET",
    redirect: "error",
    signal: AbortSignal.timeout(12000),
    headers: { accept: "application/json", "user-agent": "OMNISEC-GENESIS-public-threat-intelligence/0.1", ...headers }
  });
  if (!response.ok) throw new Error("Public source returned HTTP " + response.status + ".");
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("json")) throw new Error("Public source did not return JSON.");
  const declaredLength = Number(response.headers.get("content-length") || 0);
  if (declaredLength > MAX_RESPONSE_BYTES) throw new Error("Public source response exceeded the configured size limit.");
  let raw = "";
  if (response.body?.getReader) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let received = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > MAX_RESPONSE_BYTES) {
        await reader.cancel();
        throw new Error("Public source response exceeded the configured size limit.");
      }
      raw += decoder.decode(value, { stream: true });
    }
    raw += decoder.decode();
  } else {
    raw = await response.text();
    if (Buffer.byteLength(raw, "utf8") > MAX_RESPONSE_BYTES) throw new Error("Public source response exceeded the configured size limit.");
  }
  try { return JSON.parse(raw); } catch { throw new Error("Public source returned invalid JSON."); }
}

function cleanText(value, max = 1200) {
  return String(value || "").replace(/[\\u0000-\\u001f\\u007f]/g, " ").slice(0, max);
}

export async function getKevCatalog({ query = "", limit = 25, fetchImpl = fetch } = {}) {
  const safeLimit = Math.max(1, Math.min(50, Number.isInteger(Number(limit)) ? Number(limit) : 25));
  const catalog = await fetchJson(CISA_KEV_URL, { fetchImpl });
  if (!catalog || !Array.isArray(catalog.vulnerabilities)) throw new Error("CISA KEV feed schema was not recognised.");
  const needle = cleanText(query, 120).trim().toLowerCase();
  const matches = catalog.vulnerabilities.filter(item => {
    const haystack = [item.cveID, item.vendorProject, item.product, item.vulnerabilityName, item.shortDescription, item.requiredAction].join(" ").toLowerCase();
    return !needle || haystack.includes(needle);
  });
  return {
    source: { publisher: "CISA", title: "Known Exploited Vulnerabilities Catalog", url: CISA_KEV_URL, retrieved_at: new Date().toISOString(), catalog_version: cleanText(catalog.catalogVersion, 80), date_released: cleanText(catalog.dateReleased, 40) },
    total_catalog_entries: catalog.vulnerabilities.length,
    matching_entries: matches.length,
    query: needle,
    items: matches.slice(0, safeLimit).map(item => ({
      cve_id: cleanText(item.cveID, 32),
      vendor: cleanText(item.vendorProject, 160),
      product: cleanText(item.product, 160),
      name: cleanText(item.vulnerabilityName, 240),
      date_added: cleanText(item.dateAdded, 40),
      due_date: cleanText(item.dueDate, 40),
      ransomware_use: cleanText(item.knownRansomwareCampaignUse, 40),
      description: cleanText(item.shortDescription, 1200),
      required_action: cleanText(item.requiredAction, 600),
      source_url: "https://www.cisa.gov/known-exploited-vulnerabilities-catalog"
    }))
  };
}

function cvssFrom(metrics = {}) {
  for (const key of ["cvssMetricV40", "cvssMetricV31", "cvssMetricV30", "cvssMetricV2"]) {
    const metric = metrics[key]?.[0]?.cvssData;
    if (metric) return { version: cleanText(metric.version, 12), base_score: Number(metric.baseScore) || null, severity: cleanText(metric.baseSeverity || metrics[key]?.[0]?.baseSeverity, 24) };
  }
  return null;
}

export async function getCveIntelligence(cveId, { fetchImpl = fetch, nvdApiKey = process.env.NVD_API_KEY || "" } = {}) {
  const id = String(cveId || "").toUpperCase();
  if (!CVE_PATTERN.test(id)) throw new Error("Provide a valid CVE identifier, for example CVE-2025-12345.");
  const nvdUrl = new URL(NVD_API);
  nvdUrl.searchParams.set("cveId", id);
  const epssUrl = new URL(EPSS_API);
  epssUrl.searchParams.set("cve", id);
  const [nvdResult, epssResult] = await Promise.allSettled([
    fetchJson(nvdUrl.toString(), { fetchImpl, headers: nvdApiKey ? { apiKey: nvdApiKey } : {} }),
    fetchJson(epssUrl.toString(), { fetchImpl })
  ]);
  let vulnerability = null;
  if (nvdResult.status === "fulfilled") {
    const record = nvdResult.value?.vulnerabilities?.[0]?.cve;
    if (record) {
      const description = record.descriptions?.find(item => item.lang === "en")?.value || record.descriptions?.[0]?.value || "";
      vulnerability = {
        cve_id: id,
        state: cleanText(record.vulnStatus, 80),
        published: cleanText(record.published, 40),
        last_modified: cleanText(record.lastModified, 40),
        description: cleanText(description, 2400),
        cvss: cvssFrom(record.metrics),
        weaknesses: (record.weaknesses || []).flatMap(item => item.description || []).map(item => cleanText(item.value, 80)).filter(Boolean).slice(0, 8),
        references: (record.references || []).slice(0, 12).map(item => ({ url: cleanText(item.url, 500), tags: (item.tags || []).map(tag => cleanText(tag, 60)).slice(0, 8) })).filter(item => /^https:\/\//i.test(item.url))
      };
    }
  }
  const epss = epssResult.status === "fulfilled" ? epssResult.value?.data?.[0] : null;
  const errors = [];
  if (nvdResult.status === "rejected") errors.push("NVD: " + cleanText(nvdResult.reason?.message || "unavailable", 180));
  if (epssResult.status === "rejected") errors.push("FIRST EPSS: " + cleanText(epssResult.reason?.message || "unavailable", 180));
  return {
    cve_id: id,
    retrieved_at: new Date().toISOString(),
    vulnerability,
    exploitation_probability: epss ? { source: "FIRST EPSS", probability_30_day: Number(epss.epss), percentile: Number(epss.percentile), score_date: cleanText(epss.date, 40), url: "https://api.first.org/data/v1/epss?cve=" + encodeURIComponent(id) } : null,
    sources: [
      { publisher: "NIST NVD", url: "https://nvd.nist.gov/vuln/detail/" + id, status: nvdResult.status === "fulfilled" ? "retrieved" : "unavailable" },
      { publisher: "FIRST EPSS", url: "https://api.first.org/data/v1/epss?cve=" + encodeURIComponent(id), status: epssResult.status === "fulfilled" ? "retrieved" : "unavailable" }
    ],
    limitations: ["EPSS is an estimated probability of exploitation in the next 30 days, not proof that exploitation occurred.", "CVSS severity is not a substitute for asset exposure, exploitability validation or business impact.", "NVD and EPSS are independent datasets but not necessarily independent reporting of the underlying vulnerability."],
    errors
  };
}
