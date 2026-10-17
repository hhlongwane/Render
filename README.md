# CloudForge

An original, responsive cloud-platform demo inspired by the public developer experience of modern application-hosting services. This project is independent and is not affiliated with Render.com.

## Run locally

Open `index.html` in a browser. No build step or package installation is required.

## Publish the demo for free

This repository includes a GitHub Actions workflow at `.github/workflows/pages.yml` to publish the static site to GitHub Pages.

1. Open this repository's **Settings → Pages**.
2. Under **Build and deployment**, choose **GitHub Actions** as the source.
3. Open the **Actions** tab and run **Deploy static demo to GitHub Pages** with **Run workflow**, or push a new commit to `main`.
4. When the workflow succeeds, open **Settings → Pages** to find the live site URL.

GitHub Pages hosting is free for eligible public repositories, subject to GitHub's usage policies and limits. This is a static educational/demo site, not a production cloud-hosting service.

## Included

- Responsive marketing homepage and product pages
- Interactive pricing comparison with monthly/yearly display toggle
- Searchable quickstart documentation
- Filterable template gallery
- Dashboard with sample services, deployment history, simulated logs, and settings
- Create-service modal, demo deploy/pause/resume controls, and local browser persistence
- Accessible navigation, keyboard dismissible modal, mobile layout, and status messages

## Zero-cost goal and limitations

The site has no paid dependencies, checkout, or payment integration. Hosting the static demo can cost $0 on an eligible free tier, but providers can change their limits and terms.

This is a static front-end demo. Deployments, authentication, billing, databases, logs, and cloud infrastructure are simulated in the browser. It does not connect to Git providers, provision real services, execute builds, or host arbitrary user applications. Recreating Render's actual compute platform requires backend systems and compute/storage resources, which cannot be guaranteed free or unlimited. Do not enter secrets, passwords, API keys, or sensitive production data.

## Survival AI storage starter

This repository now also contains an **optional Supabase integration starter** for the separate Survival AI app:

- `supabase/migrations/0001_survival_ai_storage.sql` creates a PostgreSQL memory table with per-user Row Level Security and a private file-storage bucket with per-user policies.
- `integrations/survival-ai/supabaseClient.js` provides email sign-in, memory save/list/delete, private file upload, and signed-download helpers.
- `integrations/survival-ai/README.md` explains how to create your own Supabase project and connect the starter.

**Important:** these files do not create a database automatically and are not yet wired into either Survival AI repository. You must create the Supabase project, run the SQL migration, and add its URL and publishable/anon key to the actual app. Never put a Supabase service-role/secret key in browser code or a public repository. Read the [free infrastructure plan](docs/free-infrastructure-plan.md) and check current [Supabase usage limits](https://supabase.com/docs/guides/platform/billing-on-supabase) before relying on the free tier.
