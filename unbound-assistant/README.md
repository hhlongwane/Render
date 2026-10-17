# Unbound Assistant

A standalone AI assistant starter, kept separate from CloudForge and Survival AI.

## What is included

- Responsive chat interface
- Server-side OpenAI Responses API integration
- Optional model-provided web search
- Conversation context during the current browser session
- Health endpoint that reports whether a model API key is configured
- Environment-based configuration; no API key in browser code

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

## Current limitations

This is the first working foundation, not a finished autonomous coding agent. It can chat and use the model's web-search tool, but it does not yet have a persistent database, GitHub write access, computer use, or a code-execution workspace. Those should be added as separate integrations with clear permissions and isolated execution. Model API use may incur costs and remains subject to the chosen provider's capabilities, policies, and rate limits.
