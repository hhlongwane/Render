const JSON_HEADERS = { "content-type": "application/json" };

function readText(data) {
  if (typeof data?.output_text === "string" && data.output_text) return data.output_text;
  if (Array.isArray(data?.output)) {
    const text = data.output.flatMap(item => Array.isArray(item.content) ? item.content : [])
      .filter(item => item.type === "output_text" || item.type === "text")
      .map(item => item.text || "").join("\n");
    if (text) return text;
  }
  if (Array.isArray(data?.content)) return data.content.filter(item => item.type === "text").map(item => item.text || "").join("\n");
  if (Array.isArray(data?.candidates)) {
    return data.candidates.flatMap(c => c.content?.parts || []).map(part => part.text || "").join("\n");
  }
  return "";
}

export function getConfiguredProviders() {
  const providers = [];
  if (process.env.OPENAI_API_KEY) providers.push({
    id: "openai", label: "OpenAI", model: process.env.OPENAI_MODEL || "gpt-5",
    endpoint: "https://api.openai.com/v1/responses"
  });
  if (process.env.ANTHROPIC_API_KEY) providers.push({
    id: "anthropic", label: "Anthropic", model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5",
    endpoint: "https://api.anthropic.com/v1/messages"
  });
  if (process.env.GEMINI_API_KEY) providers.push({
    id: "gemini", label: "Google Gemini", model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    endpoint: "https://generativelanguage.googleapis.com/v1beta/models"
  });
  if (process.env.AI_COMPAT_BASE_URL && /^https:\/\//i.test(process.env.AI_COMPAT_BASE_URL) && process.env.AI_COMPAT_MODEL) providers.push({
    id: "compatible", label: "OpenAI-compatible endpoint", model: process.env.AI_COMPAT_MODEL,
    endpoint: process.env.AI_COMPAT_BASE_URL
  });
  return providers;
}

async function requestJson(url, options) {
  const response = await fetch(url, { ...options, headers: { ...JSON_HEADERS, ...(options.headers || {}) }, signal: AbortSignal.timeout(45000) });
  const raw = await response.text();
  let data;
  try { data = JSON.parse(raw); } catch { data = { error: raw.slice(0, 500) }; }
  if (!response.ok) {
    const message = data?.error?.message || data?.error?.status || data?.message || `Provider returned HTTP ${response.status}`;
    throw new Error(String(message).slice(0, 400));
  }
  return data;
}

export async function askProvider(providerId, { system, prompt, maxTokens = 300 }) {
  const provider = getConfiguredProviders().find(item => item.id === providerId);
  if (!provider) throw new Error("That provider is not configured in Render environment variables.");

  let data;
  if (providerId === "openai") {
    data = await requestJson(provider.endpoint, {
      method: "POST",
      headers: { authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({ model: provider.model, instructions: system, input: prompt, max_output_tokens: maxTokens, store: false })
    });
  } else if (providerId === "anthropic") {
    data = await requestJson(provider.endpoint, {
      method: "POST",
      headers: { "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: provider.model, max_tokens: maxTokens, system, messages: [{ role: "user", content: prompt }] })
    });
  } else if (providerId === "gemini") {
    const model = encodeURIComponent(provider.model);
    data = await requestJson(`${provider.endpoint}/${model}:generateContent`, {
      method: "POST",
      headers: { "x-goog-api-key": process.env.GEMINI_API_KEY },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: maxTokens, temperature: 0 }
      })
    });
  } else {
    const base = process.env.AI_COMPAT_BASE_URL.replace(/\/+$/, "");
    if (!/^https:\/\//i.test(base)) throw new Error("AI_COMPAT_BASE_URL must use HTTPS.");
    const headers = {};
    if (process.env.AI_COMPAT_API_KEY) headers.authorization = `Bearer ${process.env.AI_COMPAT_API_KEY}`;
    data = await requestJson(`${base}/chat/completions`, {
      method: "POST", headers,
      body: JSON.stringify({ model: provider.model, temperature: 0, max_tokens: maxTokens, messages: [{ role: "system", content: system }, { role: "user", content: prompt }] })
    });
    const answer = data?.choices?.[0]?.message?.content;
    return typeof answer === "string" ? answer : "";
  }
  return readText(data);
}
