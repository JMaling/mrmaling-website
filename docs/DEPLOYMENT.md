# Deploying mrmaling.com

`index.html` is a static file with no build step; `assets/` holds the
CSS/JS/fonts it uses. This mirrors the Primary Source Navigator stack:
GitHub -> Cloudflare Pages (hosting + auto-deploy) -> Cloudflare DNS
(mrmaling.com, bought on Namecheap) -> Supabase (backend, added later once
there's a feature that needs one).

## 0. Current status

- [ ] GitHub repo created and pushed
- [ ] Domain's nameservers pointed at Cloudflare
- [ ] Cloudflare Pages project connected to the repo
- [ ] mrmaling.com attached as a custom domain on the Pages project
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

Cloudflare Pages requires Cloudflare to be the domain's authoritative DNS,
so the domain has to move from Namecheap's nameservers to Cloudflare's.
This only changes *where DNS is managed* - the domain stays owned/billed
through Namecheap, nothing about registration changes.

1. Create a free Cloudflare account (if you don't have one) at
   https://dash.cloudflare.com/sign-up.
2. **Add a site** -> enter `mrmaling.com` -> pick the **Free** plan.
   Cloudflare scans for any existing DNS records (there likely aren't any
   yet) and gives you two nameservers, e.g. `ana.ns.cloudflare.com` /
   `walt.ns.cloudflare.com` (yours will differ).
3. In **Namecheap** -> Domain List -> `mrmaling.com` -> **Manage** ->
   **Nameservers** -> switch from "Namecheap BasicDNS" to **Custom DNS** ->
   enter the two Cloudflare nameservers -> save.
4. Wait for Cloudflare to show the zone as **Active** (usually minutes,
   can take a few hours for DNS propagation worldwide).

## 3. Cloudflare Pages

1. Cloudflare dashboard -> **Workers & Pages** -> **Create** -> **Pages** ->
   **Connect to Git**. Authorize Cloudflare's GitHub app for the
   `mrmaling-website` repo if prompted.
2. Build settings:
   - **Build command**: leave **blank** for now (the site is plain static
     files with nothing to build until Supabase is wired up - see step 5).
   - **Build output directory**: `/`
3. Deploy. Cloudflare gives the project a `*.pages.dev` URL immediately -
   confirm the header renders there before moving on.
4. Project -> **Custom domains** -> **Add a custom domain** -> enter
   `mrmaling.com` (and `www.mrmaling.com` if you want that to work too).
   Because the zone is now on Cloudflare, it creates the DNS record and
   provisions SSL automatically (a few minutes).
5. From then on, every push to `main` rebuilds and republishes
   automatically. Cloudflare's **"Retry deployment"** re-runs the *same*
   build against the *same* commit - if a deploy failed and you've since
   pushed a fix, look for the newer automatic deployment instead.

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
3. Cloudflare Pages project -> **Settings** -> **Environment variables** ->
   add `SUPABASE_URL` and `SUPABASE_ANON_KEY` (the **anon** key, never
   `service_role`) for **Production** (and **Preview** too, if preview
   deploys should point at a separate project).
4. Turn the build command back on:
   `node scripts/build-supabase-config.js` - this writes
   `assets/js/supabase-config.js` from those two env vars at build time.
5. For local dev against the hosted project, copy
   `assets/js/supabase-config.example.js` to `assets/js/supabase-config.js`
   (gitignored) and fill in the same two values, or run `supabase start`
   for a fully local stack.

## What must NOT be committed or deployed

- `.env`, `.env.local`, or anything containing a `service_role` key
- `assets/js/supabase-config.js` (gitignored - generated per environment)

## Cache headers

`_headers` (Cloudflare Pages convention) sets long-lived caching for fonts,
`no-cache` for CSS/JS/HTML so a redeploy is always visible. Each CSS/JS
`<link>`/`<script>` tag also carries a `?v=YYYYMMDD-N` query string as a
belt-and-braces cache-buster - bump it whenever `assets/css/` or
`assets/js/` changes.
