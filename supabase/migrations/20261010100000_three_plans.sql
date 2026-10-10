-- Three plans (2026-10-10): Grátis (10 chat bookings per 30-day cycle), Agenda and Pro, with a
-- 7-day trial of a paid plan, once per account. "team" stays accepted as legacy (= pro).

-- ---------------------------------------------------------------------------
-- Businesses
-- ---------------------------------------------------------------------------
alter table public.businesses drop constraint if exists businesses_plan_check;
alter table public.businesses
  add constraint businesses_plan_check check (plan in ('free', 'agenda', 'pro', 'team'));

alter table public.businesses
  add column trial_plan text check (trial_plan in ('agenda', 'pro')),
  add column signup_choice text check (signup_choice in ('free', 'trial_agenda', 'trial_pro'));

-- No automatic trial any more: the person chooses at sign-up (or later in the panel, once).
drop trigger if exists businesses_start_trial on public.businesses;
drop function if exists private.start_trial_on_create();

-- Existing accounts (decided 2026-10-10: migrate everyone now).
-- Subscribers of the single plan become Agenda; their Asaas value is updated by the billing job.
update public.businesses set plan = 'agenda' where plan in ('pro', 'team');
-- Running 30-day trials become a Pro trial ending at most 7 days from now.
update public.businesses
set trial_plan = 'pro', trial_ends_at = least(trial_ends_at, now() + interval '7 days')
where plan = 'free' and trial_ends_at > now();
-- Ended trials count as used.
update public.businesses
set trial_plan = 'pro'
where trial_started_at is not null and trial_plan is null;

-- Grátis: chat bookings of the current cycle are counted often.
create index if not exists appointments_chat_created_idx
  on public.appointments (business_id, created_at)
  where source = 'chat';

-- ---------------------------------------------------------------------------
-- Subscriptions
-- ---------------------------------------------------------------------------
alter table public.subscriptions drop constraint if exists subscriptions_plan_check;
alter table public.subscriptions
  add constraint subscriptions_plan_check check (plan in ('agenda', 'pro', 'team'));
alter table public.subscriptions
  add column pending_plan text check (pending_plan in ('agenda', 'pro')),
  add column needs_reprice boolean not null default false;

update public.subscriptions
set plan = 'agenda', needs_reprice = status in ('pending', 'active', 'overdue')
where plan in ('pro', 'team');

-- ---------------------------------------------------------------------------
-- One trial per person: hashes of the e-mail, phone and CPF/CNPJ that already used it, kept
-- even if the account is deleted (so a new account with the same data gets no new trial).
-- ---------------------------------------------------------------------------
create table public.trial_claims (
  kind text not null check (kind in ('email', 'phone', 'document')),
  value_hash text not null check (value_hash ~ '^[0-9a-f]{64}$'),
  business_id uuid references public.businesses (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (kind, value_hash)
);
alter table public.trial_claims enable row level security;
-- No policies: only the server (service role) reads and writes it.

-- Accounts that already had a trial: claim their owner's e-mail and the business WhatsApp.
insert into public.trial_claims (kind, value_hash, business_id)
select 'email', encode(sha256(convert_to(lower(u.email), 'UTF8')), 'hex'), b.id
from public.businesses b
join public.members m on m.business_id = b.id and m.role = 'owner'
join auth.users u on u.id = m.user_id
where b.trial_plan is not null and u.email is not null
on conflict do nothing;

insert into public.trial_claims (kind, value_hash, business_id)
select 'phone', encode(sha256(convert_to(s.whatsapp_number, 'UTF8')), 'hex'), b.id
from public.businesses b
join public.page_settings s on s.business_id = b.id
where b.trial_plan is not null and s.whatsapp_number is not null
on conflict do nothing;
