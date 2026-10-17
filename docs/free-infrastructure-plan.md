# Survival AI: zero-cost infrastructure plan

The goal is to keep the first working version at $0 using free tiers, without pretending free services are unlimited.

## Suggested starting architecture

- **Website/static frontend:** GitHub Pages (already configured in this repository's Actions workflow).
- **PostgreSQL, authentication and private file storage:** Supabase Free.
- **App code and version history:** GitHub.
- **Server-side AI/API work:** add a free-tier serverless worker only when the app needs it; keep provider keys in server-side environment secrets.
- **AI model usage:** use a free model/provider tier where available, or run a small local model on hardware you control. Model APIs may charge, and a hosted AI model is not guaranteed free.

## What this repository contains now

- \`supabase/migrations/0001_survival_ai_storage.sql\`: schema and per-user row/file security policies.
- \`integrations/survival-ai/supabaseClient.js\`: sign-in, memory CRUD and private-file helpers.
- \`integrations/survival-ai/.env.example\`: configuration variable names.
- \`integrations/survival-ai/README.md\`: setup and test instructions.

## What still requires your action

1. Create the Supabase project in your account.
2. Run the SQL migration in that project's SQL Editor.
3. Add the project URL and publishable/anon key to the real Survival AI app's environment.
4. Integrate the client helper into that app and test with two accounts.
5. Configure deployment secrets only in the provider dashboard, not in GitHub source.

## Cost and safety rules

- Check the provider's current quotas before deploying; free limits and terms can change.
- Configure usage alerts/limits where available. A free tier can stop serving when a quota is exhausted.
- Never expose database passwords, service-role keys, model API keys, or other secrets in browser code, public GitHub commits, screenshots, or chat.
- RLS must remain enabled. Do not create a public bucket for private AI data.
- Export important data periodically. A free service is not a substitute for backups.
- Do not send personal or sensitive data to an AI model unless the product's privacy design and provider terms support it.

This is a practical first step toward cloud storage and a backend. It is not yet a general-purpose platform for deploying arbitrary apps, and it does not provision compute for Survival AI automatically.
