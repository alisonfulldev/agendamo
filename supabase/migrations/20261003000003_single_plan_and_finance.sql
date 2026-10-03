-- Single plan (2026-10-03): 30-day trial on sign-up, then R$ 29/month or R$ 240/year with
-- 1 professional included and R$ 9/month per extra professional. "free" now means "no
-- subscription" (trial or expired); "pro" is the subscribed plan; the old "team" counts as "pro".
-- Also: simple finance for owners (revenues from completed appointments + manual entries).

-- ---------------------------------------------------------------------------
-- Professional seats (1 included + paid extras). Kept on the business so plan checks stay sync.

alter table public.businesses
  add column professional_seats integer not null default 1 check (professional_seats between 1 and 50);

alter table public.subscriptions
  add column extra_professionals integer not null default 0 check (extra_professionals between 0 and 49);

-- Old Team businesses keep 5 seats; their professionals stay active.
update public.businesses set professional_seats = 5 where plan = 'team';
update public.subscriptions set extra_professionals = 4 where plan = 'team';

-- Photos: one limit for the subscribed plan (and the trial).
create or replace function public.photo_limit(p_plan text)
returns integer
language sql
immutable
set search_path = ''
as $$
  select 60;
$$;

/**
 * After (re)subscribing with fewer seats than active professionals: the extra ones become
 * inactive (lowest positions are kept). Nothing is deleted. Idempotent.
 */
create function public.apply_professional_seats(p_business_id uuid, p_seats integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.businesses set professional_seats = greatest(1, p_seats) where id = p_business_id;
  update public.professionals pr
  set active = false
  where pr.business_id = p_business_id
    and pr.active
    and pr.id not in (
      select keep.id from public.professionals keep
      where keep.business_id = p_business_id and keep.active
      order by keep.position, keep.created_at
      limit greatest(1, p_seats)
    );
end;
$$;

revoke execute on function public.apply_professional_seats(uuid, integer) from public, anon, authenticated;
grant execute on function public.apply_professional_seats(uuid, integer) to service_role;

-- ---------------------------------------------------------------------------
-- The trial starts with the business (no card, once per business).

create or replace function private.start_trial_on_create()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.plan = 'free' and new.trial_started_at is null then
    new.trial_started_at := now();
    new.trial_ends_at := now() + interval '30 days';
  end if;
  return new;
end;
$$;

create trigger businesses_start_trial
before insert on public.businesses
for each row execute function private.start_trial_on_create();

-- ---------------------------------------------------------------------------
-- Finance

create table public.finance_entries (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  kind text not null check (kind in ('income', 'expense')),
  category text not null check (char_length(trim(category)) between 1 and 40),
  description text not null check (char_length(trim(description)) between 1 and 200),
  amount_cents integer not null check (amount_cents > 0 and amount_cents <= 100000000),
  occurred_on date not null,
  payment_method text check (payment_method is null or payment_method in ('pix', 'cash', 'card', 'other')),
  customer_id uuid,
  -- Set on revenues created automatically from a completed appointment.
  appointment_id uuid unique,
  created_at timestamptz not null default now(),
  foreign key (customer_id, business_id)
    references public.customers (id, business_id) on delete set null (customer_id),
  foreign key (appointment_id, business_id)
    references public.appointments (id, business_id) on delete cascade
);

create index finance_entries_business_date_idx on public.finance_entries (business_id, occurred_on);

alter table public.finance_entries enable row level security;

create policy "owner manages finance" on public.finance_entries
  for all to authenticated
  using (private.is_owner(business_id))
  with check (private.is_owner(business_id));

/** Completed appointment -> revenue (charged price, minus coupon); leaving "completed" removes it. */
create function private.sync_appointment_revenue()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_amount integer;
  v_names text;
  v_tz text;
begin
  if new.status = 'completed' and (tg_op = 'INSERT' or old.status is distinct from 'completed') then
    select coalesce(sum(s.price_cents), 0), coalesce(string_agg(s.name, ' + ' order by s.position), 'Atendimento')
      into v_amount, v_names
      from public.appointment_services s
     where s.appointment_id = new.id;
    v_amount := v_amount - coalesce(new.discount_cents, 0);
    if v_amount > 0 then
      select b.timezone into v_tz from public.businesses b where b.id = new.business_id;
      insert into public.finance_entries
        (business_id, kind, category, description, amount_cents, occurred_on, customer_id, appointment_id)
      values
        (new.business_id, 'income', 'Atendimento', left(v_names, 200), v_amount,
         (new.starts_at at time zone coalesce(v_tz, 'America/Sao_Paulo'))::date, new.customer_id, new.id)
      on conflict (appointment_id) do nothing;
    end if;
  elsif tg_op = 'UPDATE' and old.status = 'completed' and new.status <> 'completed' then
    delete from public.finance_entries where appointment_id = new.id;
  end if;
  return new;
end;
$$;

create trigger appointments_sync_revenue
after insert or update of status on public.appointments
for each row execute function private.sync_appointment_revenue();

-- Revenues for appointments completed before this migration.
insert into public.finance_entries
  (business_id, kind, category, description, amount_cents, occurred_on, customer_id, appointment_id)
select a.business_id, 'income', 'Atendimento', left(coalesce(s.names, 'Atendimento'), 200),
       s.total - a.discount_cents, (a.starts_at at time zone b.timezone)::date, a.customer_id, a.id
from public.appointments a
join public.businesses b on b.id = a.business_id
join lateral (
  select sum(x.price_cents)::integer as total, string_agg(x.name, ' + ' order by x.position) as names
  from public.appointment_services x where x.appointment_id = a.id
) s on true
where a.status = 'completed' and s.total - a.discount_cents > 0
on conflict (appointment_id) do nothing;
