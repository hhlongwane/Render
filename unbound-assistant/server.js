import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
const port = Number(process.env.PORT || 3000);
const model = process.env.OPENAI_MODEL || "gpt-5";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

const instructions = `You are Unbound, a capable general-purpose AI assistant.
Help users plan and complete legitimate tasks, write and explain code, research questions,
and develop projects step by step. Be candid about uncertainty and about actions you have
not actually performed. Use available tools when helpful. Never claim access to a user's
files, accounts, repository, or computer unless an enabled integration actually provides it.
Do not request secrets in chat. For actions that could destroy data, expose credentials,
spend money, or affect other people, explain the impact and ask for confirmation before
proceeding. Follow applicable law and the model provider's requirements.`;

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, model, apiKeyConfigured: Boolean(process.env.OPENAI_API_KEY) });
});

app.post("/api/chat", async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({
        error: "The assistant is not connected yet. Add OPENAI_API_KEY in the hosting environment settings."
      });
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

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        instructions,
        input,
        tools: [{ type: "web_search" }],
        store: false
      })
    });

    const data = await response.json();
    if (!response.ok) {
      const message = data?.error?.message || "The model provider returned an error.";
      return res.status(response.status).json({ error: message });
    }

    const answer = typeof data.output_text === "string" ? data.output_text : "";
    if (!answer) {
      return res.status(502).json({ error: "The model returned no text. Please try again." });
    }

    res.json({ answer, model, responseId: data.id || null });
  } catch (error) {
    console.error("Chat request failed:", error?.message || error);
    res.status(500).json({ error: "The assistant request failed. Check server logs and try again." });
  }
});

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Unbound Assistant listening on port ${port}`);
});
