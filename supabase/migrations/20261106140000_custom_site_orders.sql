-- Custom site (2026-11-06): R$ 197 with the first month of "Site + Agenda", or R$ 148 for
-- subscribers. The owner fills a briefing in the panel and pays; the platform owner has the site
-- made (a template of its own in the code) within 5 business days; one round of adjustments.

create table public.custom_site_orders (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  -- Answers of the briefing (validated on the server) and the photos sent (R2 keys).
  briefing jsonb not null default '{}'::jsonb,
  briefing_sent_at timestamptz,
  -- "with_plan": paid in the first payment of the subscription (new customer, R$ 197);
  -- "single": a one-off Pix (subscriber, R$ 148).
  payment_kind text not null check (payment_kind in ('with_plan', 'single')),
  price_cents integer not null check (price_cents > 0),
  payment_id text,
  pix_payload text,
  pix_image text,
  pix_expires_at timestamptz,
  paid_at timestamptz,
  -- 5 business days from when it has both the payment and the briefing.
  due_at timestamptz,
  delivered_at timestamptz,
  adjustment_text text check (adjustment_text is null or char_length(adjustment_text) <= 2000),
  adjustment_requested_at timestamptz,
  finished_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One open order per business at a time.
create unique index custom_site_orders_open_idx on public.custom_site_orders (business_id)
  where finished_at is null and cancelled_at is null;
create index custom_site_orders_payment_idx on public.custom_site_orders (payment_id);

alter table public.custom_site_orders enable row level security;
create policy "members read custom site orders" on public.custom_site_orders
  for select to authenticated using (private.is_member(business_id));
-- Writes go through the server (owner checked there).
revoke insert, update, delete on public.custom_site_orders from anon, authenticated;
grant select on public.custom_site_orders to authenticated;
grant select, insert, update, delete on public.custom_site_orders to service_role;
