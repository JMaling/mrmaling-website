# mrmaling.com

Mr. Maling's class website — links and resources for students. Static
HTML/CSS/JS, no build step, styled with the same design system as
[Primary Source Navigator](https://github.com/JMaling/primary-source-navigator)
(Averia fonts, corkboard/paper theme, shared button/table/form primitives in
`public/assets/css/shared.css`).

## Local development

No build step, no server required for a static preview:

```bash
cd public && python3 -m http.server 8000
```

Then open http://127.0.0.1:8000.

If/when this site starts talking to Supabase (auth, forms, stored data),
copy `public/assets/js/supabase-config.example.js` to
`public/assets/js/supabase-config.js` (gitignored) and fill in a project's
`SUPABASE_URL` and **anon** key. See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## Structure

- `public/` — everything actually served to visitors, deployed as-is by
  Wrangler (`wrangler.jsonc` points at this directory).
  - `index.html` — the site's entry point.
  - `assets/css/shared.css` — design tokens, fonts, and shared UI primitives
    (buttons, badges, tables, forms, tabs), shared with Primary Source Navigator.
  - `assets/css/site.css` — layout specific to this site.
  - `assets/fonts/` — self-hosted Averia Libre / Averia Sans Libre (`.woff2`).
  - `_headers` — Cloudflare cache-control rules.
- `wrangler.jsonc` — tells Cloudflare's Workers/Wrangler deploy which
  directory (`public/`) to serve as static assets.
- `scripts/build-supabase-config.js` — generates the browser Supabase config
  from environment variables at Cloudflare build time.
- `supabase/` — Supabase CLI project config, for when this site needs a backend.

## Deployment

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for the full runbook: GitHub →
Cloudflare Workers/Pages → mrmaling.com domain (via Namecheap DNS) → Supabase.
