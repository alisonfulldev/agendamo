-- 4-digit sign-in codes (2026-10-06): Supabase only issues 6+ digit e-mail codes, so the code is
-- ours. We keep its HMAC (never the code itself) and the one-time sign-in token from Supabase
-- (generateLink), used only after the code matches. Rows live 10 minutes (daily cleanup).

alter table public.email_codes
  add column code_hash text,
  add column link_token text;
