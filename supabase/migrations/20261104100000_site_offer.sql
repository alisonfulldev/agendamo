-- "Site + Agenda" offer (2026-11-04): sold by a dedicated sign-up link (?criar=1&oferta=site).
-- The business starts without the trial and pays R$ 97 (site + first month) [+ R$ 91 domain],
-- then R$ 39/month by Pix Automático. The site is built by hand within 48 business hours.

alter table public.businesses
  add column offer text check (offer is null or offer in ('site'));

create table public.site_orders (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null unique references public.businesses (id) on delete cascade,
  status text not null default 'awaiting_payment'
    check (status in ('awaiting_payment', 'paid', 'delivered')),
  wants_domain boolean not null default false,
  /** Domain the owner asked for ("studiolumi.com.br"), checked by hand when building the site. */
  domain_name text check (domain_name is null or char_length(domain_name) between 3 and 100),
  paid_at timestamptz,
  /** 48 business hours after the payment. */
  due_at timestamptz,
  delivered_at timestamptz,
  /** "Falta só o pagamento" e-mail, sent once a day after the sign-up. */
  reminder_sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index site_orders_status_idx on public.site_orders (status, due_at);

-- The owner (and staff) read their own order; every write goes through the server.
alter table public.site_orders enable row level security;
create policy "members read site order" on public.site_orders
  for select to authenticated using (private.is_member(business_id));
revoke insert, update, delete on public.site_orders from anon, authenticated;
grant select on public.site_orders to authenticated;
grant select, insert, update, delete on public.site_orders to service_role;
