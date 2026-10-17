# Connect Survival AI to cloud storage

This folder is an integration starter, not a live database. You must create and configure your own Supabase project before data is stored online.

## What this provides

- PostgreSQL table for structured AI memory/data (\`ai_memories\`)
- Email/password sign-up, sign-in and sign-out helpers
- Save, list and delete memory records
- Private file uploads and short-lived signed download links
- Row Level Security (RLS) policies that limit each signed-in user to their own rows and files

## Setup

1. Create a project at [Supabase](https://supabase.com/). Choose the Free plan and review its current quotas and inactivity rules before storing anything important.
2. Open the project's SQL Editor.
3. Run the complete migration in [\`../../supabase/migrations/0001_survival_ai_storage.sql\`](../../supabase/migrations/0001_survival_ai_storage.sql).
4. In your actual Survival AI app, install the JavaScript SDK with \`npm install @supabase/supabase-js\`.
5. Copy the variable names from this folder's \`.env.example\` into the app's local environment file, then fill in the Project URL and publishable/anon key from your Supabase project.
6. Keep environment values out of source control when they contain secrets. The publishable/anon key is designed for client use only when RLS is configured correctly. **Never expose a service-role/secret key in browser code.**
7. Copy/adapt \`supabaseClient.js\` into the actual app and import the helpers where you want to save memory or upload files.
8. Test with two separate user accounts. Confirm each account cannot read, change, or delete the other account's rows or files.

## Quick example

\`\`\`js
import {
  signInWithEmail,
  saveMemory,
  listMemories,
  uploadPrivateFile,
} from './supabaseClient.js';

await signInWithEmail(email, password);
await saveMemory('assistant-preferences', {
  tone: 'direct',
  preferredLanguage: 'English',
});
const memories = await listMemories();
await uploadPrivateFile(fileInput.files[0]);
\`\`\`

## Important limitations

- This starter is not yet connected to the existing Survival AI repository or its UI.
- A Supabase project is not created automatically by committing these files.
- Free tiers have quotas, and providers can change limits or pause inactive projects. There is no promise of unlimited storage or compute for $0.
- Do not store passwords, API keys, payment data, or other secrets as AI memory.
- This is user-scoped storage, not a complete vector database/RAG system. Semantic search, embeddings, backups, and server-side AI inference can be added later.
- Before production use, add automated RLS tests, file-size/type limits, retention/deletion rules, and a backup/export plan.
