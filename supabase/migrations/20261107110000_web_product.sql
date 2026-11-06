-- "Site ou Loja" (2026-11-07): a new MeetChat product, only a site, without booking: R$ 29/mês
-- (plan tier "web"). The business is a site (services; every button opens the WhatsApp) or a
-- store (catalog with a bag that opens the WhatsApp with the order). Its panel has only the site
-- editor, a few numbers, the subscription and the account. Nothing of the booking product changes.

-- What the business is: the booking product (everything that exists), a site or a store.
alter table public.businesses
  add column product text not null default 'booking' check (product in ('booking', 'site', 'store'));

-- The new plan "web" next to the existing ones.
alter table public.businesses drop constraint businesses_plan_tier_check;
alter table public.businesses add constraint businesses_plan_tier_check
  check (plan_tier in ('complete', 'site', 'web'));
alter table public.subscriptions drop constraint subscriptions_tier_check;
alter table public.subscriptions add constraint subscriptions_tier_check
  check (tier in ('complete', 'site', 'web'));
alter table public.subscriptions drop constraint subscriptions_next_tier_check;
alter table public.subscriptions add constraint subscriptions_next_tier_check
  check (next_tier is null or next_tier in ('complete', 'site', 'web'));
alter table public.assisted_sales drop constraint assisted_sales_tier_check;
alter table public.assisted_sales add constraint assisted_sales_tier_check
  check (tier in ('complete', 'site', 'web'));

-- Four new templates (two for sites, two for stores); the booking templates stay as they are.
alter table public.site_settings drop constraint site_settings_template_check;
alter table public.site_settings add constraint site_settings_template_check check (
  template in ('vibrant', 'elegant', 'site_bold', 'site_clean', 'store_showcase', 'store_clean')
);

-- Text of the WhatsApp message the site's buttons open (null = the default one).
alter table public.site_settings
  add column whatsapp_message text
    check (whatsapp_message is null or char_length(whatsapp_message) between 2 and 300);

-- What a site offers (services) or a store sells (products).
create table public.catalog_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  kind text not null check (kind in ('service', 'product')),
  name text not null check (char_length(name) between 1 and 120),
  description text check (description is null or char_length(description) <= 1000),
  -- Optional for services ("sob consulta"); products show it.
  price_cents integer check (price_cents is null or price_cents between 0 and 100000000),
  category text check (category is null or char_length(category) between 1 and 60),
  -- R2 key of the photo (compressed in the browser, like the page photos).
  image_key text check (image_key is null or char_length(image_key) <= 300),
  position integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index catalog_items_business_idx on public.catalog_items (business_id, kind, position);

alter table public.catalog_items enable row level security;
create policy "members read catalog items" on public.catalog_items
  for select to authenticated using (private.is_member(business_id));
-- Writes go through the server (owner checked there), like the site settings; public pages read
-- with the service role.
revoke insert, update, delete on public.catalog_items from anon, authenticated;
grant select on public.catalog_items to authenticated;
grant select, insert, update, delete on public.catalog_items to service_role;

-- Addresses of the new sales chat and public pages.
insert into public.reserved_slugs (slug)
values ('criar-site'), ('site-profissional'), ('loja-virtual')
on conflict do nothing;
