-- Two plans (2026-11-05): "Completo" (chat + agenda) and "Site + Agenda" (the same + a landing page
-- at /<slug>/site, built from the business data and edited by the owner). businesses.plan keeps
-- saying whether the business pays ("free" / "complete"); plan_tier says which plan.
-- The 14-day trial includes the site for everyone.

alter table public.businesses
  add column plan_tier text not null default 'complete' check (plan_tier in ('complete', 'site'));

alter table public.subscriptions
  add column tier text not null default 'complete' check (tier in ('complete', 'site')),
  -- Moving down to "Completo": the site stays until the paid period ends, then the tier changes.
  add column next_tier text check (next_tier is null or next_tier in ('complete', 'site'));

-- The owner's edits of the site; empty fields fall back to the business data and brand colors.
create table public.site_settings (
  business_id uuid primary key references public.businesses (id) on delete cascade,
  primary_color text check (primary_color is null or primary_color ~ '^#[0-9A-Fa-f]{6}$'),
  accent_color text check (accent_color is null or accent_color ~ '^#[0-9A-Fa-f]{6}$'),
  hero_title text check (hero_title is null or char_length(hero_title) between 2 and 90),
  hero_subtitle text check (hero_subtitle is null or char_length(hero_subtitle) between 2 and 240),
  cta_label text check (cta_label is null or char_length(cta_label) between 2 and 40),
  hero_image_key text check (hero_image_key is null or char_length(hero_image_key) <= 300),
  -- Sections in order, each { key, visible }; null = the default order, all visible.
  sections jsonb,
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;
create policy "members read site settings" on public.site_settings
  for select to authenticated using (private.is_member(business_id));
-- Writes go through the server (owner checked there), like the other page settings.
revoke insert, update, delete on public.site_settings from anon, authenticated;
grant select on public.site_settings to authenticated;
grant select, insert, update, delete on public.site_settings to service_role;
