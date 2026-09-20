# Deploying mrmaling.com

`public/` holds everything actually served to visitors (`index.html` +
`assets/`) - static files, no build step. `wrangler.jsonc` at the repo root
points Cloudflare's Workers deploy at that directory. This mirrors the
Primary Source Navigator stack: GitHub -> Cloudflare (hosting + auto-deploy)
-> Cloudflare DNS (mrmaling.com, bought on Namecheap) -> Supabase (backend,
added later once there's a feature that needs one).

Note: Cloudflare's "Connect to Git" flow now provisions these as **Workers**
projects (deployed via `npx wrangler deploy`), not the older "Pages" flow
with a dashboard build-output-directory field. Functionally equivalent for
a static site like this one - the difference is config lives in
`wrangler.jsonc` instead of dashboard settings.

## 0. Current status

- [x] GitHub repo created and pushed
- [x] Domain's nameservers pointed at Cloudflare
- [ ] Cloudflare Worker project connected to the repo
- [ ] mrmaling.com attached as a custom domain on the Worker project
- [ ] Supabase project created and linked (not needed yet - nothing on the
      site talks to a database yet)

## 1. GitHub

Repo: https://github.com/JMaling/mrmaling-website (public).

```bash
git add -A
git commit -m "..."
git push origin main
```

## 2. Point mrmaling.com at Cloudflare

Cloudflare requires Cloudflare to be the domain's authoritative DNS, so the
domain has to move from Namecheap's nameservers to Cloudflare's. This only
changes *where DNS is managed* - the domain stays owned/billed through
Namecheap, nothing about registration changes.

1. Cloudflare dashboard -> **Add a domain** -> enter `mrmaling.com` -> pick
   the **Free** plan. Cloudflare scans for any existing DNS records and
   shows two nameservers, e.g. `keanu.ns.cloudflare.com` /
   `meiling.ns.cloudflare.com`.
2. On the DNS review screen: the scan will likely show Namecheap's parking
   page A/CNAME records and possibly Namecheap's free-email-forwarding
   MX/SPF records - safe to ignore/skip both (the parking records get
   replaced once the custom domain is attached in step 3 below; the email
   ones only matter if you're actually using Namecheap email forwarding,
   in which case Cloudflare's own free **Email Routing** feature, under the
   domain's Email tab, is a simpler replacement).
3. In **Namecheap** -> Domain List -> `mrmaling.com` -> **Manage** ->
   **Nameservers** -> switch from "Namecheap BasicDNS" to **Custom DNS** ->
   enter the two Cloudflare nameservers -> save.
4. Wait for Cloudflare to show the zone as **Active** (check propagation
   with `dig NS mrmaling.com @1.1.1.1` - usually minutes, can take longer).

## 3. Cloudflare Worker (static assets)

1. Cloudflare dashboard -> **Workers & Pages** -> **Create** -> **Pages**
   tab -> **Connect to Git**. Authorize Cloudflare's GitHub app for the
   `mrmaling-website` repo if prompted.
2. Setup screen:
   - **Project name**: `mrmaling-website`
   - **Build command**: leave **blank** for now (nothing to build until
     Supabase is wired up - see step 5)
   - **Deploy command**: leave as the prefilled `npx wrangler deploy` -
     it reads `wrangler.jsonc`, which points at `public/`
3. Click **Deploy**. Cloudflare gives the project a `*.workers.dev` URL -
   confirm the header renders there before moving on.
4. Project -> **Settings** -> **Domains & Routes** (or **Custom domains**,
   naming varies) -> add `mrmaling.com` (and `www.mrmaling.com` if wanted).
   Because the zone is on Cloudflare, it creates the DNS record and
   provisions SSL automatically (a few minutes).
5. From then on, every push to `main` redeploys automatically.

## 4. Supabase (add when the site needs a backend)

Nothing on the site reads/writes data yet, so skip this until there's an
actual feature that needs it (a sign-up form, login-gated assignments,
etc.). When that day comes:

1. Create a project at https://supabase.com (free tier is plenty to start).
2. Link the CLI and apply migrations:
   ```bash
   supabase link --project-ref <project-ref>
   supabase db push
   ```
3. Cloudflare project -> **Settings** -> **Environment variables** -> add
   `SUPABASE_URL` and `SUPABASE_ANON_KEY` (the **anon** key, never
   `service_role`) for **Production** (and **Preview** too, if preview
   deploys should point at a separate project).
4. Turn the build command back on:
   `node scripts/build-supabase-config.js` - this writes
   `public/assets/js/supabase-config.js` from those two env vars at build
   time, before `npx wrangler deploy` runs.
5. For local dev against the hosted project, copy
   `public/assets/js/supabase-config.example.js` to
   `public/assets/js/supabase-config.js` (gitignored) and fill in the same
   two values, or run `supabase start` for a fully local stack.

## What must NOT be committed or deployed

- `.env`, `.env.local`, or anything containing a `service_role` key
- `public/assets/js/supabase-config.js` (gitignored - generated per environment)

## Cache headers

`public/_headers` (a convention Cloudflare's static-asset serving still
honors) sets long-lived caching for fonts, `no-cache` for CSS/JS/HTML so a
redeploy is always visible. Each CSS/JS `<link>`/`<script>` tag also
carries a `?v=YYYYMMDD-N` query string as a belt-and-braces cache-buster -
bump it whenever `assets/css/` or `assets/js/` changes.
