# Unbound Assistant

A standalone AI workspace inside this repository. It is separate from CloudForge and Survival AI.

## What works in this starter

- Chat powered by the OpenAI Responses API with web search
- Image generation through the OpenAI Images API
- Optional video generation through a configured Replicate model
- Dedicated Chat, Image, and Video modes in the UI
- Browser-local chat history and user-controlled memory notes
- Server-side provider keys (never exposed in frontend code)
- App-password protection for provider-backed endpoints
- Per-IP in-memory request limits for chat, image, and video endpoints
- Health endpoint that reports which integrations are configured

This is an extensible foundation, not a claim of unlimited or unrestricted ability. Each generation service must be configured and can have its own costs, account requirements, rate limits, and content rules. The video provider is configurable because available models and input schemas vary.

## Setup

Requires Node.js 20 or newer.

1. Copy `.env.example` to `.env`.
2. Set `OPENAI_API_KEY` and a random `APP_ACCESS_PASSWORD` of at least 16 characters.
3. Optionally set `OPENAI_MODEL` and `OPENAI_IMAGE_MODEL`.
4. Run `npm install`, then `npm start`.
5. Open `http://localhost:3000` and use **Access** to enter the app password.

Keep `.env` private. Never commit provider tokens, paste them into chat, or put them in frontend code.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `OPENAI_API_KEY` | For chat and images | Server-side key for the OpenAI API |
| `APP_ACCESS_PASSWORD` | Yes | Shared app password, minimum 16 characters |
| `OPENAI_MODEL` | No | Chat model; defaults to `gpt-5` |
| `OPENAI_IMAGE_MODEL` | No | Image model; defaults to `gpt-image-2.5-flare` |
| `REPLICATE_API_TOKEN` | For video | Server-side Replicate token |
| `REPLICATE_VIDEO_MODEL` | For video | Currently available Replicate model slug in `owner/name` format |
| `PORT` | No | Server port; defaults to 3000 |

### Image generation

Select **Generate image**, describe the image, and submit. The server calls the OpenAI Images API. The default model and output format can be changed using server environment settings and the image route. Image API access may require account verification or billing configuration with the provider.

### Video generation

Select **Generate video** after configuring `REPLICATE_API_TOKEN` and `REPLICATE_VIDEO_MODEL`. Pick a currently available video model from your Replicate account/catalog and verify its expected input schema. This starter sends `{ "prompt": "..." }`; models that require extra fields or a different schema will need a model-specific adapter. The UI polls the job and displays the returned output when it is a playable URL.

## Deploy on Render

Create a **Web Service** from this repository and set **Root Directory** to `unbound-assistant`.

- Build command: `npm install`
- Start command: `npm start`

Add the environment variables in the service's secret/environment settings. At minimum, set `OPENAI_API_KEY` and a strong `APP_ACCESS_PASSWORD`. Add the Replicate variables only if you want video generation. Do not publish provider secrets in GitHub.

## Memory

Type `Remember: I prefer step-by-step answers` in Chat mode to save a note. Use **Memory** to review or delete notes. Type `Forget all memories` to clear browser-local memory. Chat history and memories are stored only in the current browser; they do not sync between devices and can be lost when browser data is cleared. Do not save passwords or API keys as memories.

## Security and costs

- The app password is a shared access gate, not full user accounts. Use a long random value and only share it with trusted users.
- Request limits are in-memory and per server process; they are not a substitute for account authentication, a persistent quota system, or provider-side spending limits.
- Publicly reachable hosting can still incur API costs from people who know the shared password. Configure provider-side budgets/alerts and restrict deployment access where possible.
- Generated image data is returned to the browser and is not currently stored in a durable media library.
- Do not use this starter as a production multi-tenant service without proper identity, durable rate limits, quotas, monitoring, and access controls.

## Next engineering milestones

1. Add real user authentication and database-backed memories/projects.
2. Add a task planner with checkpoints, resumable jobs, and audit history.
3. Add a controlled coding workspace with isolated execution, file editing, tests, and time/resource limits.
4. Add authorized GitHub integration so users can explicitly select repositories and review proposed changes.
5. Add provider adapters for more image/video/audio models and model-specific parameters.
6. Add durable media storage, background jobs, deployment checks, and usage metering.

The assistant must only report actions as completed after the relevant tool/provider confirms success. No prompt can create capabilities that have not been connected or provisioned.
