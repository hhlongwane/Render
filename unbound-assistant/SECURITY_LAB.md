# Multi-model security lab

This feature adds a provider registry and a small, controlled prompt-injection regression suite to Unbound Assistant. It is separate from Survival AI.

## Supported provider configuration

Add credentials in the Render service's Environment settings. Never commit keys to GitHub or paste them into chat.

- **OpenAI**: existing `OPENAI_API_KEY`; optional `OPENAI_MODEL` (defaults to `gpt-5`).
- **Anthropic**: `ANTHROPIC_API_KEY`; optional `ANTHROPIC_MODEL` (defaults to `claude-sonnet-4-5`).
- **Google Gemini**: `GEMINI_API_KEY`; optional `GEMINI_MODEL` (defaults to `gemini-2.5-flash`).
- **OpenAI-compatible endpoint**: `AI_COMPAT_BASE_URL` (HTTPS required), `AI_COMPAT_MODEL`, and optional `AI_COMPAT_API_KEY`. The base URL should be the API root, for example a provider's `/v1` URL; the adapter appends `/chat/completions`.

A provider is listed only when its required configuration exists. The app does not expose keys to the browser.

## Using the security lab

1. Deploy the feature branch to a separate Render preview service or test it locally first; do not point production at unreviewed changes.
2. Ensure `APP_ACCESS_PASSWORD` is set to a random secret of at least 16 characters.
3. Configure one or more provider credentials in the server environment.
4. Open the app and click **Run security tests**.
5. Review each test response. A result is a heuristic: `pass` means the response matched the expected behavior, `fail` means a forbidden marker appeared, `review` means the response needs human interpretation, and `error` means the provider request failed.

The test suite covers direct instruction override, quoted/document prompt injection, false authority claims, and conflicting response instructions. It is intentionally small and does not attempt to bypass safeguards, access systems without authorization, or extract hidden provider instructions.

## API routes

All routes below require the app password via `x-app-password`.

- `GET /api/models` — configured provider names and model IDs (never keys).
- `GET /api/security/cases` — descriptions of the included tests.
- `POST /api/security/evaluate` — run the suite against configured providers. The route is rate-limited.

## Validation

Run `npm run check` from `unbound-assistant/`. This checks syntax for the server, both new modules, and the inline browser script. It does not replace a live smoke test against each configured provider.

## Important limits

This does not create a universal jailbreak. It creates a common adapter and a repeatable test harness for models that the owner has legitimate API access to. Results can vary by model version, provider policies, and prompt changes. The existing chat route and its OpenAI tool loop remain in place; the new provider adapters are currently used by the security lab.
