-- SEO funnel of the MeetChat site (Fase 9, 2026-10-16): anonymous page views and clicks on
-- "Criar meu link" of the marketing pages. Rule 5: no IP, no personal data, only an anonymous
-- session id (sessionStorage, cleared with the tab); bots and signed-in users are not recorded.
-- Account creation, link published (same moment) and first booking come from existing tables
-- (audit_log business.created with its source; appointments). Only the service role reads/writes.

create table public.site_events (
  id bigint generated always as identity primary key,
  type text not null check (type in ('page_view', 'cta_click')),
  path text not null check (char_length(path) between 1 and 200),
  /** Page template: home, nicho, subpagina, diretorio, agendamento, ferramenta, comparar, recursos, ajuda, precos, outro. */
  template text not null check (char_length(template) between 1 and 40),
  /** Niche brand key of the page, when it has one. */
  niche text check (niche is null or char_length(niche) <= 40),
  /** First page of the session (attribution). */
  landing text check (landing is null or char_length(landing) <= 200),
  session_id uuid not null,
  created_at timestamptz not null default now()
);

create index site_events_created_at_idx on public.site_events (created_at);
create index site_events_type_template_idx on public.site_events (type, template, created_at);

-- RLS on and no policy: anon and authenticated can neither read nor write (the API route uses
-- the service role after validation and rate limiting).
alter table public.site_events enable row level security;
revoke all on public.site_events from anon, authenticated;
grant select, insert, delete on public.site_events to service_role;

-- Keep 400 days (enough for year-over-year comparisons); cleaned daily.
create function public.purge_site_events()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.site_events where created_at < now() - interval '400 days';
$$;

revoke execute on function public.purge_site_events() from public;
grant execute on function public.purge_site_events() to service_role;
