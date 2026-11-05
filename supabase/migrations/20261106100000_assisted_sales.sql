-- WhatsApp sales (2026-11-06): the platform admin creates the account and business for a customer
-- who bought in the chat, and sends the Pix of the first payment (no trial). The sale is paid when
-- the subscription's first payment arrives (activateBusinessPlan). Also the site template.

-- Two site templates: "vibrant" (color blocks, the first one) and "elegant" (light, serif titles).
alter table public.site_settings
  add column template text not null default 'vibrant' check (template in ('vibrant', 'elegant'));

create table public.assisted_sales (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  -- Admin who sold it.
  seller_id uuid references auth.users (id) on delete set null,
  -- Public payment page /pagar/<token> (random, 128 bits).
  token text not null unique check (char_length(token) between 20 and 64),
  tier text not null check (tier in ('complete', 'site')),
  cycle text not null check (cycle in ('monthly', 'yearly')),
  value_cents integer not null check (value_cents > 0),
  payer_name text not null check (char_length(payer_name) between 2 and 120),
  payer_email text not null check (char_length(payer_email) between 5 and 254),
  payer_whatsapp text check (payer_whatsapp is null or char_length(payer_whatsapp) <= 20),
  status text not null default 'awaiting_payment'
    check (status in ('awaiting_payment', 'paid', 'cancelled')),
  -- Last Pix generated (copy-and-paste code and QR image); a new one replaces it.
  pix_payload text,
  pix_image text,
  pix_expires_at timestamptz,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index assisted_sales_business_idx on public.assisted_sales (business_id);
create index assisted_sales_created_idx on public.assisted_sales (created_at desc);

-- Only the server (service role) reads and writes: the admin screens and the payment page.
alter table public.assisted_sales enable row level security;
revoke all on public.assisted_sales from anon, authenticated;
grant select, insert, update, delete on public.assisted_sales to service_role;
