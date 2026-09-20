#!/usr/bin/env node
// Generates assets/js/supabase-config.js from SUPABASE_URL / SUPABASE_ANON_KEY
// environment variables at build time. Intended for CI/CD static hosts (e.g.
// Cloudflare Pages build command) where the gitignored, hand-copied version
// of this file (see docs/DEPLOYMENT.md) can't exist in a fresh clone.
//
// Only the anon key is handled here — never point this at a service_role
// key or any other secret; the anon key is safe to ship to the browser
// because Row Level Security is what actually protects data.

const fs = require("fs");
const path = require("path");

const { SUPABASE_URL, SUPABASE_ANON_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    "build-supabase-config: SUPABASE_URL and SUPABASE_ANON_KEY must both be set " +
      "in the build environment."
  );
  process.exit(1);
}

const outPath = path.join(__dirname, "..", "public", "assets", "js", "supabase-config.js");

const contents = `/* Generated at build time by scripts/build-supabase-config.js from the
   SUPABASE_URL / SUPABASE_ANON_KEY build environment variables. Do not edit
   by hand or commit — this file is gitignored. See docs/DEPLOYMENT.md. */
window.SITE_CONFIG = {
  SUPABASE_URL: ${JSON.stringify(SUPABASE_URL)},
  SUPABASE_ANON_KEY: ${JSON.stringify(SUPABASE_ANON_KEY)}
};
`;

fs.writeFileSync(outPath, contents);
console.log(`build-supabase-config: wrote ${outPath}`);
