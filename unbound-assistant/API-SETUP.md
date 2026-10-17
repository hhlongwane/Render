# API Setup Checklist for Unbound Assistant

This checklist distinguishes integrations that work in the current starter from integrations that still need engineering work. Never paste secret keys into a chat or commit them to GitHub.

## 1. Required now: OpenAI API

**Get a key:** https://platform.openai.com/api-keys  
**API docs:** https://developers.openai.com/api/reference/overview  
**Add this server environment variable:** `OPENAI_API_KEY`

One OpenAI API key powers the current starter's:
- Chat and Responses API
- Built-in web search (no separate search API key is needed for this tool)
- Sandboxed Python code interpreter
- Image generation and image editing
- Text-to-speech audio
- Audio transcription

The code currently calls these endpoints:
- `POST https://api.openai.com/v1/responses`
- `POST https://api.openai.com/v1/images/generations`
- `POST https://api.openai.com/v1/images/edits`
- `POST https://api.openai.com/v1/audio/speech`
- `POST https://api.openai.com/v1/audio/transcriptions`

Set these optional model variables only if you want to change defaults:
- `OPENAI_MODEL=gpt-5`
- `OPENAI_IMAGE_MODEL=gpt-image-2`
- `OPENAI_AUDIO_MODEL=gpt-4o-mini-tts`
- `OPENAI_TRANSCRIBE_MODEL=gpt-transcribe`

**Important:** API usage is billed separately from a ChatGPT subscription. Your account must have access to the selected models and sufficient API billing/usage allowance.

## 2. Required for the app's shared-password gate

Set `APP_ACCESS_PASSWORD` to a randomly generated secret of at least 16 characters in your hosting service's environment settings. This is your own app password, not a third-party API key. The current starter uses one shared password; it does not yet provide individual user accounts.

## 3. Required for video generation

**Get a token:** https://replicate.com/account/api-tokens  
**Browse models:** https://replicate.com/explore  
**Docs:** https://replicate.com/docs  
**Add these server environment variables:**
- `REPLICATE_API_TOKEN` — secret token from Replicate
- `REPLICATE_VIDEO_MODEL` — exact model slug in `owner/name` format, copied from the model page
- `REPLICATE_VIDEO_DEFAULT_INPUT` — optional JSON object containing additional input fields required by your chosen model

The app calls Replicate's prediction API. The model must actually support video generation and the input fields must match its published schema. Model availability, prices, output format, and restrictions vary.

Do not build on OpenAI's old Sora Videos API: OpenAI's deprecation notice says that API and the Sora 2 API models were removed on September 24, 2026. The current video adapter is therefore provider-configurable.

## 4. Needed for persistent accounts, memories, projects, and job history (not wired up yet)

**Create a project:** https://supabase.com/dashboard  
**Docs:** https://supabase.com/docs/guides/getting-started/api-keys

Planned server environment variables:
- `SUPABASE_URL` — project URL from the project's Connect dialog or Data API settings
- `SUPABASE_PUBLISHABLE_KEY` — publishable key for browser-side Supabase Auth clients, protected by Row Level Security
- `SUPABASE_SECRET_KEY` — server-only key for trusted backend operations; never put this in the browser

Supabase would provide Postgres, Auth, and a place to store per-user chat history, memory notes, project records, task checkpoints, and usage records. It is not connected by the current starter yet; don't add these variables expecting the app to use them until the database/auth code and policies are implemented.

## 5. Needed for real repository coding and GitHub changes (not wired up yet)

**Create a GitHub App:** https://github.com/settings/apps/new  
**Docs:** https://docs.github.com/en/apps/creating-github-apps/writing-code-for-a-github-app/quickstart

Planned credentials:
- `GITHUB_APP_ID`
- `GITHUB_PRIVATE_KEY` — PEM private key, server only
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET` — server only, if using the OAuth web authorization flow
- `GITHUB_WEBHOOK_SECRET` — only if webhooks are configured

Install the app only on the repositories you want this AI to access. Start with repository metadata read, contents read/write, and pull-request read/write if you want it to create branches and propose reviewed changes. Add other permissions only for a feature that needs them. A user's existing ChatGPT/Codex authorization does not automatically authorize this separate app.

The GitHub integration must be implemented before these variables do anything. The current app does not yet read or edit your repository through its own runtime.

## 6. Needed for a full isolated coding workspace (not wired up yet)

**Create an E2B account/key:** https://e2b.dev/  
**Docs:** https://e2b.dev/docs

Planned server environment variable:
- `E2B_API_KEY`

E2B can provide isolated Linux sandboxes, file operations, and command execution for coding agents. This would be used for a persistent project workspace that can install dependencies, edit files, run tests, and return logs without executing arbitrary code on the main web server. The current app's Code Interpreter is a separate, hosted Python sandbox and does not replace this full workspace.

## 7. Optional: persistent generated-file storage (not wired up yet)

**Create a bucket:** https://dash.cloudflare.com/  
**R2 docs:** https://developers.cloudflare.com/r2/get-started/s3/

Planned environment variables:
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`
- `R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com`

Use bucket-scoped Object Read & Write permissions. R2 can store generated images, videos, exports, uploaded project files, and downloadable artifacts so that results survive a browser refresh. The current app does not store generated media permanently.

## 8. Optional: extra voices and speech tools (not wired up)

**Get a key:** https://elevenlabs.io/app/settings/api-keys  
**Docs:** https://elevenlabs.io/docs/api-reference/authentication

Planned variable: `ELEVENLABS_API_KEY`. This is optional because the current starter already uses OpenAI's speech API. Add ElevenLabs only if a specific voice, dubbing, or speech feature requires it.

## 9. Deploy the currently implemented starter

In your hosting provider's server environment/secret settings, set:
1. `OPENAI_API_KEY`
2. `APP_ACCESS_PASSWORD`
3. `REPLICATE_API_TOKEN`
4. `REPLICATE_VIDEO_MODEL`
5. Optionally `REPLICATE_VIDEO_DEFAULT_INPUT`

Use Render Web Service settings:
- Root Directory: `unbound-assistant`
- Build command: `npm install`
- Start command: `npm start`

Only the first two are needed to try chat, web search, image generation/editing, speech, transcription, and Python code interpreter. Add the Replicate variables to enable video. Whether each call works also depends on provider access, billing, selected model availability, and model-specific input schema.

## Security rules

- Never commit real API keys or private keys.
- Never put server secrets in frontend code.
- Never paste API secrets into ChatGPT. Enter them directly into the hosting provider's environment-variable settings.
- Use provider spending limits and usage alerts.
- The shared app password is a temporary gate, not production-grade per-user authentication.
- Don't grant the GitHub App access to all repositories unless that is genuinely necessary.
