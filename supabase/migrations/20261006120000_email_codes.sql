-- Sign-in by e-mail code (2026-10-06): when the last code was sent to an e-mail and how many
-- wrong attempts it had. The code itself lives in Supabase Auth; here only our rules: 10-minute
-- validity, 5 attempts, 30 s between sends. Server only.

create table public.email_codes (
  email text primary key check (email = lower(email)),
  sent_at timestamptz not null default now(),
  attempts integer not null default 0 check (attempts >= 0)
);

alter table public.email_codes enable row level security;
revoke all on table public.email_codes from anon, authenticated;
grant select, insert, update, delete on table public.email_codes to service_role;

/** Old rows go with the daily cleanup (codes are only valid for 10 minutes anyway). */
create function public.purge_email_codes()
returns integer
language sql
security definer
set search_path = ''
as $$
  with gone as (
    delete from public.email_codes where sent_at < now() - interval '1 day' returning 1
  )
  select count(*)::integer from gone;
$$;

revoke execute on function public.purge_email_codes() from public, anon, authenticated;
grant execute on function public.purge_email_codes() to service_role;

/** Whether an e-mail already has an account ("Esse e-mail já tem conta"). Server only. */
create function public.email_has_account(p_email text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from auth.users where lower(email) = lower(p_email));
$$;

revoke execute on function public.email_has_account(text) from public, anon, authenticated;
grant execute on function public.email_has_account(text) to service_role;
