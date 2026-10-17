# Unbound Assistant

A standalone AI assistant starter, kept separate from CloudForge and Survival AI.

## Included

- Responsive chat interface
- Server-side OpenAI Responses API integration
- Model-provided web search
- Conversation history stored in the current browser
- Explicit user-controlled memories stored in the current browser
- Memory review and deletion controls
- Health endpoint and environment-based configuration
- No API key in browser code

## Save a memory

In the chat, type:

```
Remember: I prefer step-by-step explanations and I want you to test code changes.
```

The note is saved to browser storage and sent as context with future requests from that browser. Click **Memory** to review or delete notes. Type `Forget all memories` to clear saved notes. Chat history and memories are local to that browser; clearing browser storage or switching devices removes access to them. Do not save passwords, API keys, or other secrets as memories.

## Run locally

Requires Node.js 20 or newer.

1. Copy `.env.example` to `.env`.
2. Add your API key to `.env` and keep that file private.
3. Install dependencies with `npm install`.
4. Start with `npm start`.
5. Open `http://localhost:3000`.

## Deploy as a web service

Create a Node web service pointing at this repository with **Root Directory** set to `unbound-assistant`. Use:

- Build command: `npm install`
- Start command: `npm start`

Set `OPENAI_API_KEY` in the hosting provider's environment/secret settings. Optionally set `OPENAI_MODEL` and `PORT`. Never put secrets in GitHub, frontend code, screenshots, or chat messages.

## Roadmap toward a more capable agent

1. Persistent account-based memory with authentication and a database.
2. Explicit task plans, checkpoints, and resumable jobs.
3. Authorized GitHub integration for reading, editing, and testing repositories.
4. Isolated coding workspace for running builds and tests.
5. User-approved tool permissions and action audit logs.
6. Deployment monitoring, automated tests, and recovery from common errors.

## Current limitations

This is a useful first foundation, not a completed autonomous coding agent. It can chat, use web search, and retain browser-local context, but it does not yet have direct GitHub write access from the app, computer use, a code-execution workspace, or durable cross-device memory. Those require separate integrations, suitable infrastructure, and configuration. Model API use may incur costs and remains subject to the chosen provider's capabilities, policies, and rate limits.
