-- Creation conversation (2026-10-06): demonstrations built on the home page before having an
-- account. Server only (no policies), never indexed, gone after 7 days (daily cleanup cron).

create table public.demos (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 120),
  brand_key text not null,
  /** What the person said they do when picking "Outro". */
  niche_description text check (niche_description is null or char_length(niche_description) <= 200),
  photo_key text,
  /** Services shown in the test booking: [{ name, durationMinutes }]. */
  services jsonb not null default '[]'::jsonb,
  suggested_slug text,
  /** Where it came from: utm_*, ?nome= (prospecting), ?ramo=, page, referrer. */
  source jsonb not null default '{}'::jsonb,
  /** Accepted texts: [{ text, version, at }]. */
  consents jsonb not null default '[]'::jsonb,
  test_bookings integer not null default 0 check (test_bookings >= 0),
  /** Hashed client IP (rate limits per IP; the raw IP is never stored). */
  ip_hash text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days'
);

create index demos_expires_at_idx on public.demos (expires_at);
create index demos_ip_hash_idx on public.demos (ip_hash, created_at);

alter table public.demos enable row level security;
revoke all on table public.demos from anon, authenticated;
grant select, insert, update, delete on table public.demos to service_role;

/** Deletes expired demonstrations; returns their photo keys so the cron removes the files too. */
create function public.purge_expired_demos()
returns table (photo_key text)
language sql
security definer
set search_path = ''
as $$
  delete from public.demos where expires_at < now() returning photo_key;
$$;

revoke execute on function public.purge_expired_demos() from public, anon, authenticated;
grant execute on function public.purge_expired_demos() to service_role;
