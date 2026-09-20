/* Copy this file to supabase-config.js (gitignored) and fill in your
   project's local/hosted values. Only the anon key belongs here - it is
   safe to ship to the browser because Row Level Security and the
   authorization checks inside RPCs are what actually protect data.
   NEVER put the service_role key or any other server secret in this file
   or other browser-loaded code. */
window.SITE_CONFIG = {
  SUPABASE_URL: "http://127.0.0.1:54321",
  SUPABASE_ANON_KEY: "replace-with-local-anon-key-from-supabase-status"
};
