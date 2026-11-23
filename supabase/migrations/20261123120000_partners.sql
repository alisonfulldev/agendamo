-- Programa de parceiros (2026-11-23): qualquer pessoa se cadastra em /parceiros, divulga o link
-- meetchat.com.br/?parceiro=<código> e ganha 100% da 1ª mensalidade paga de cada cliente que
-- indicou + 20% de cada mensalidade seguinte, enquanto o cliente pagar. Um nível só (nada por
-- indicar parceiros). A comissão fica liberada 30 dias depois do pagamento e é paga por Pix pelo
-- admin. CPF e chave Pix ficam criptografados (ENCRYPTION_KEY); os hashes servem para não pagar
-- comissão sobre a própria conta do parceiro.
create table public.partners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  code text not null unique check (code ~ '^[a-z0-9]{4,20}$'),
  name text not null,
  email text not null,
  phone text not null,
  cpf_encrypted text not null,
  pix_key_encrypted text not null,
  email_hash text not null,
  phone_hash text,
  cpf_hash text not null unique,
  status text not null default 'active' check (status in ('active', 'blocked')),
  terms_version text not null,
  terms_accepted_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.businesses
  add column partner_id uuid references public.partners (id) on delete set null,
  add column partner_attributed_at timestamptz;
create index businesses_partner_id_idx on public.businesses (partner_id) where partner_id is not null;

create table public.partner_payouts (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners (id) on delete cascade,
  amount_cents integer not null check (amount_cents > 0),
  paid_at timestamptz not null default now(),
  paid_by uuid references auth.users (id) on delete set null,
  note text
);
create index partner_payouts_partner_id_idx on public.partner_payouts (partner_id);

create table public.partner_commissions (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners (id) on delete cascade,
  business_id uuid not null references public.businesses (id) on delete cascade,
  -- Cobrança do Asaas que gerou a comissão (idempotência do webhook).
  provider_payment_id text not null unique,
  kind text not null check (kind in ('first', 'recurring')),
  payment_cents integer not null,
  amount_cents integer not null check (amount_cents >= 0),
  status text not null default 'pending' check (status in ('pending', 'paid', 'cancelled')),
  -- Liberada para pagamento a partir daqui (30 dias depois do pagamento do cliente).
  available_at timestamptz not null,
  payout_id uuid references public.partner_payouts (id) on delete set null,
  created_at timestamptz not null default now()
);
create index partner_commissions_partner_id_idx on public.partner_commissions (partner_id, status);
create index partner_commissions_business_id_idx on public.partner_commissions (business_id);

-- Só o servidor (service role) lê e grava: nenhuma política para usuários.
alter table public.partners enable row level security;
alter table public.partner_payouts enable row level security;
alter table public.partner_commissions enable row level security;

-- /parceiros é uma rota: nenhum negócio pode usar esse endereço.
insert into public.reserved_slugs (slug) values ('parceiros') on conflict do nothing;
