-- Own domain sold with "Site + Agenda" (2026-11-06): R$ 91/year, registered by the platform
-- owner at Registro.br in the customer's name, then connected to Vercel by the system.

alter table public.custom_domains
  -- awaiting_payment: in a sale not paid yet; awaiting_registration: paid, to register at
  -- Registro.br; connecting: added to Vercel, waiting for the DNS; live: verified and serving.
  add column status text not null default 'connecting'
    check (status in ('awaiting_payment', 'awaiting_registration', 'connecting', 'live')),
  -- Paid until at Registro.br (renewal reminder 30 days before).
  add column expires_at date,
  add column updated_at timestamptz not null default now();

update public.custom_domains set status = 'live' where verified;

alter table public.assisted_sales
  add column domain text check (domain is null or domain ~ '^[a-z0-9-]+(\.[a-z0-9-]+)+$'),
  add column domain_cents integer not null default 0 check (domain_cents >= 0);
