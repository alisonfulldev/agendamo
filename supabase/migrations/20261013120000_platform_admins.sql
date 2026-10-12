-- Platform administrators kept in the database (2026-10-13): access to /admin and its own
-- e-mail + password sign-in (/admin/entrar). Only the server (service role) reads or writes it.
create table public.platform_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.platform_admins enable row level security;
revoke all on public.platform_admins from anon, authenticated;

insert into public.platform_admins (user_id)
select id from auth.users where lower(email) = 'alisonlima977@gmail.com'
on conflict do nothing;
