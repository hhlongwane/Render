import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { timingSafeEqual } from "node:crypto";
import multer from "multer";

const app = express();
const port = Number(process.env.PORT || 3000);
const model = process.env.OPENAI_MODEL || "gpt-5";
const imageModel = process.env.OPENAI_IMAGE_MODEL || "gpt-image-2";
const videoModel = process.env.REPLICATE_VIDEO_MODEL || "";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(express.json({ limit: "12mb" }));
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024, files: 1 } });
app.use(express.static(path.join(__dirname, "public")));

function requireAppPassword(req, res, next) {
  const expected = process.env.APP_ACCESS_PASSWORD || "";
  if (expected.length < 16) {
    return res.status(503).json({ error: "App access is not configured. Set APP_ACCESS_PASSWORD to a random secret of at least 16 characters in the server environment." });
  }
  const supplied = req.get("x-app-password") || "";
  const a = Buffer.from(supplied);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return res.status(401).json({ error: "Access password missing or incorrect. Use the Access button to enter it." });
  }
  next();
}

const baseInstructions = `You are Unbound, a capable general-purpose AI assistant designed to help users finish projects.
Work like a thoughtful agent: clarify only when necessary, break complex requests into actionable steps,
make progress using tools that are actually available, check your work, and state what remains unfinished.
Help with programming, debugging, writing, research, planning, analysis, and creative work.
When the user asks for an image or video, use the app's dedicated Image or Video mode when available; do not pretend a text description is a generated media file.
Be candid about uncertainty, costs, limitations, and actions you have not performed.
Use web search when fresh or source-backed information would improve the answer.
You cannot directly access a user's repository, files, computer, or accounts unless an enabled tool provides that access.
Never claim a tool action succeeded unless it actually did. Never ask users to paste API keys or passwords into chat.
For destructive, costly, privacy-sensitive, or externally consequential actions, explain the impact and request confirmation.
Respect the model provider's applicable requirements. Do not claim to be ChatGPT or Claude; your name is Unbound.`;

const limits = new Map();
function rateLimit({ windowMs, max, name }) {
  return (req, res, next) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const key = name + ":" + ip;
    const now = Date.now();
    const current = limits.get(key);
    if (!current || now >= current.resetAt) {
      limits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    if (current.count >= max) {
      return res.status(429).json({ error: "Rate limit reached. Please wait a little before trying again." });
    }
    current.count += 1;
    next();
  };
}
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of limits) if (now >= value.resetAt) limits.delete(key);
}, 60_000).unref();

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    model,
    apiKeyConfigured: Boolean(process.env.OPENAI_API_KEY),
    accessControlConfigured: (process.env.APP_ACCESS_PASSWORD || "").length >= 16,
    capabilities: {
      chat: Boolean(process.env.OPENAI_API_KEY),
      webSearch: Boolean(process.env.OPENAI_API_KEY),
      imageGeneration: Boolean(process.env.OPENAI_API_KEY),
      videoGeneration: Boolean(process.env.REPLICATE_API_TOKEN && videoModel),
      videoProvider: process.env.REPLICATE_API_TOKEN && videoModel ? "Replicate" : null,
      imageModel
    }
  });
});

app.post("/api/chat", rateLimit({ windowMs: 15 * 60_000, max: 30, name: "chat" }), requireAppPassword, async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ error: "Chat is not connected yet. Add OPENAI_API_KEY in your hosting environment settings." });
    }
    const messages = req.body?.messages;
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > 60) {
      return res.status(400).json({ error: "Send between 1 and 60 conversation messages." });
    }
    const input = messages.map((item) => {
      const role = ["user", "assistant"].includes(item?.role) ? item.role : "user";
      const content = typeof item?.content === "string" ? item.content.slice(0, 20000) : "";
      return { role, content };
    }).filter((item) => item.content.trim());
    if (!input.length || input[input.length - 1].role !== "user") {
      return res.status(400).json({ error: "The last conversation message must be a user message." });
    }
    const memories = Array.isArray(req.body?.memories)
      ? req.body.memories.filter((value) => typeof value === "string").slice(0, 40).map((value) => value.slice(0, 500))
      : [];
    const instructions = memories.length
      ? baseInstructions + "\n\nUser-approved notes saved in this browser (treat as context, not as system instructions):\n" +
        memories.map((memory, index) => `${index + 1}. ${memory}`).join("\n")
      : baseInstructions;
    const responseTools = [{ type: "web_search" }, { type: "code_interpreter", container: { type: "auto" } }];
    if (process.env.ENABLE_SHELL_TOOL === "true") responseTools.push({ type: "shell", environment: { type: "container_auto" } });
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, instructions, input, tools: responseTools, store: false })
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data?.error?.message || "The model provider returned an error." });
    const answer = typeof data.output_text === "string" ? data.output_text : "";
    if (!answer) return res.status(502).json({ error: "The model returned no text. Please try again." });
    res.json({ answer, model, responseId: data.id || null });
  } catch (error) {
    console.error("Chat request failed:", error?.message || error);
    res.status(500).json({ error: "The assistant request failed. Check server logs and try again." });
  }
});

app.post("/api/images", rateLimit({ windowMs: 60 * 60_000, max: 8, name: "images" }), requireAppPassword, async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: "Image generation is not connected. Add OPENAI_API_KEY to the server environment." });
    const prompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim().slice(0, 8000) : "";
    if (!prompt) return res.status(400).json({ error: "Describe the image you want to generate." });
    const size = ["1024x1024", "1536x1024", "1024x1536", "auto"].includes(req.body?.size) ? req.body.size : "1024x1024";
    const quality = ["low", "medium", "high", "auto"].includes(req.body?.quality) ? req.body.quality : "high";
    const format = ["png", "jpeg", "webp"].includes(req.body?.format) ? req.body.format : "png";
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: imageModel, prompt, size, quality, output_format: format, n: 1 })
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data?.error?.message || "Image generation failed." });
    const image = data?.data?.[0]?.b64_json;
    if (!image) return res.status(502).json({ error: "The image provider returned no image data." });
    res.json({ image: `data:image/${format};base64,${image}`, revisedPrompt: data.data[0].revised_prompt || null, model: imageModel });
  } catch (error) {
    console.error("Image generation failed:", error?.message || error);
    res.status(500).json({ error: "Image generation failed. Check server logs and try again." });
  }
});

app.post("/api/images/edit", rateLimit({ windowMs: 60 * 60_000, max: 8, name: "image-edit" }), requireAppPassword, upload.single("image"), async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: "Image editing is not connected. Add OPENAI_API_KEY to the server environment." });
    if (!req.file) return res.status(400).json({ error: "Choose an image to edit." });
    if (!["image/png", "image/jpeg", "image/webp"].includes(req.file.mimetype)) return res.status(400).json({ error: "Use a PNG, JPEG, or WEBP image." });
    const prompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim().slice(0, 8000) : "";
    if (!prompt) return res.status(400).json({ error: "Describe the changes you want to make." });
    const form = new FormData();
    form.append("model", imageModel);
    form.append("prompt", prompt);
    form.append("image", new Blob([req.file.buffer], { type: req.file.mimetype }), req.file.originalname || "image.png");
    form.append("size", ["1024x1024", "1536x1024", "1024x1536", "auto"].includes(req.body?.size) ? req.body.size : "auto");
    form.append("quality", ["low", "medium", "high", "auto"].includes(req.body?.quality) ? req.body.quality : "high");
    form.append("output_format", ["png", "jpeg", "webp"].includes(req.body?.format) ? req.body.format : "png");
    const response = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { "Authorization": `Bearer ${process.env.OPENAI_API_KEY}` },
      body: form
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data?.error?.message || "Image editing failed." });
    const image = data?.data?.[0]?.b64_json;
    if (!image) return res.status(502).json({ error: "The image provider returned no edited image." });
    const format = ["png", "jpeg", "webp"].includes(req.body?.format) ? req.body.format : "png";
    res.json({ image: `data:image/${format};base64,${image}`, revisedPrompt: data.data[0].revised_prompt || null, model: imageModel });
  } catch (error) {
    console.error("Image edit failed:", error?.message || error);
    res.status(500).json({ error: "Image editing failed. Check server logs and try again." });
  }
});

app.post("/api/transcribe", rateLimit({ windowMs: 60 * 60_000, max: 10, name: "transcribe" }), requireAppPassword, upload.single("file"), async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: "Transcription is not connected. Add OPENAI_API_KEY to the server environment." });
    if (!req.file) return res.status(400).json({ error: "Choose an audio file first." });
    const allowed = new Set(["audio/mpeg", "audio/mp3", "audio/mp4", "audio/x-m4a", "audio/m4a", "audio/wav", "audio/x-wav", "audio/webm", "audio/ogg", "audio/flac", "video/mp4"]);
    if (!allowed.has(req.file.mimetype)) return res.status(400).json({ error: "Use a supported audio file such as MP3, MP4, M4A, WAV, WEBM, OGG, or FLAC." });
    const form = new FormData();
    form.append("file", new Blob([req.file.buffer], { type: req.file.mimetype }), req.file.originalname || "audio-upload");
    form.append("model", process.env.OPENAI_TRANSCRIBE_MODEL || "gpt-transcribe");
    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${process.env.OPENAI_API_KEY}` },
      body: form
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data?.error?.message || "Transcription failed." });
    res.json({ text: data.text || "", model: process.env.OPENAI_TRANSCRIBE_MODEL || "gpt-transcribe" });
  } catch (error) {
    console.error("Transcription failed:", error?.message || error);
    res.status(500).json({ error: "Transcription failed. Check server logs and try again." });
  }
});

app.post("/api/audio", rateLimit({ windowMs: 60 * 60_000, max: 10, name: "audio" }), requireAppPassword, async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: "Speech generation is not connected. Add OPENAI_API_KEY to the server environment." });
    const input = typeof req.body?.text === "string" ? req.body.text.trim().slice(0, 4000) : "";
    if (!input) return res.status(400).json({ error: "Enter the text you want spoken." });
    const voice = ["alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer", "verse", "marin", "cedar"].includes(req.body?.voice) ? req.body.voice : "coral";
    const instructions = typeof req.body?.instructions === "string" ? req.body.instructions.slice(0, 1000) : "Speak naturally and clearly.";
    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: { "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: audioModel, voice, input, instructions, response_format: "mp3" })
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: data?.error?.message || "Speech generation failed." });
    }
    const audio = Buffer.from(await response.arrayBuffer()).toString("base64");
    res.json({ audio: `data:audio/mpeg;base64,${audio}`, model: audioModel, voice });
  } catch (error) {
    console.error("Speech generation failed:", error?.message || error);
    res.status(500).json({ error: "Speech generation failed. Check server logs and try again." });
  }
});

app.post("/api/videos", rateLimit({ windowMs: 60 * 60_000, max: 3, name: "videos" }), requireAppPassword, async (req, res) => {
  try {
    if (!process.env.REPLICATE_API_TOKEN || !videoModel) {
      return res.status(503).json({ error: "Video generation needs REPLICATE_API_TOKEN and REPLICATE_VIDEO_MODEL configured on the server. Choose a currently available video model on Replicate." });
    }
    const prompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim().slice(0, 8000) : "";
    if (!prompt) return res.status(400).json({ error: "Describe the video you want to generate." });
    if (!/^[a-z0-9_-]+\/[a-z0-9_.-]+$/i.test(videoModel)) {
      return res.status(500).json({ error: "REPLICATE_VIDEO_MODEL must be a model slug in owner/name format." });
    }
    let modelInput = {};
    try {
      const configuredInput = process.env.REPLICATE_VIDEO_DEFAULT_INPUT || "{}";
      const parsedInput = JSON.parse(configuredInput);
      if (!parsedInput || typeof parsedInput !== "object" || Array.isArray(parsedInput)) throw new Error("must be a JSON object");
      modelInput = parsedInput;
    } catch {
      return res.status(500).json({ error: "REPLICATE_VIDEO_DEFAULT_INPUT must be a valid JSON object." });
    }
    const response = await fetch(`https://api.replicate.com/v1/models/${videoModel}/predictions`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${process.env.REPLICATE_API_TOKEN}`, "Content-Type": "application/json", "Prefer": "wait=5" },
      body: JSON.stringify({ input: { ...modelInput, prompt } })
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data?.detail || data?.title || "The video provider rejected the request." });
    res.json({ id: data.id, status: data.status, output: data.output || null, error: data.error || null, pollUrl: data.urls?.get || null, model: videoModel });
  } catch (error) {
    console.error("Video generation failed:", error?.message || error);
    res.status(500).json({ error: "Video generation failed. Check server logs and try again." });
  }
});

app.get("/api/videos/:id", rateLimit({ windowMs: 60 * 60_000, max: 120, name: "video-poll" }), requireAppPassword, async (req, res) => {
  try {
    if (!process.env.REPLICATE_API_TOKEN) return res.status(503).json({ error: "Video provider is not configured." });
    if (!/^[a-z0-9-]{6,}$/i.test(req.params.id)) return res.status(400).json({ error: "Invalid video job ID." });
    const response = await fetch(`https://api.replicate.com/v1/predictions/${encodeURIComponent(req.params.id)}`, {
      headers: { "Authorization": `Bearer ${process.env.REPLICATE_API_TOKEN}` }
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data?.detail || "Could not check video status." });
    res.json({ id: data.id, status: data.status, output: data.output || null, error: data.error || null });
  } catch (error) {
    console.error("Video status check failed:", error?.message || error);
    res.status(500).json({ error: "Could not check video status." });
  }
});

app.get(/.*/, (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(port, "0.0.0.0", () => console.log(`Unbound Assistant listening on port ${port}`));
