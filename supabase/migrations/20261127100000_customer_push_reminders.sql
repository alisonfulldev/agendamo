-- Customer reminders by web push (2026-11-27): Android through the browser, iPhone with the app
-- installed from the appointment page (PWA). No e-mail reminder anymore (only a fallback e-mail
-- when no notification could be delivered).

-- The customer's device, tied to the customer of that business: their next appointments are
-- reminded too, without asking again. Saved through the secret link of an appointment.
create table public.customer_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  customer_id uuid not null,
  endpoint text not null check (char_length(endpoint) between 10 and 1000),
  p256dh text not null check (char_length(p256dh) between 10 and 200),
  auth text not null check (char_length(auth) between 10 and 100),
  platform text not null default 'other' check (platform in ('android', 'ios', 'other')),
  created_at timestamptz not null default now(),
  -- The push service said the device is gone (404/410): never used again.
  expired_at timestamptz,
  unique (customer_id, endpoint),
  foreign key (customer_id, business_id)
    references public.customers (id, business_id) on delete cascade
);
create index customer_push_subscriptions_customer_idx
  on public.customer_push_subscriptions (customer_id) where expired_at is null;
alter table public.customer_push_subscriptions enable row level security;
-- No policies: written and read only by the server (service role).

-- Every notification sent to customers, to measure delivery and alert when it fails.
create table public.customer_push_deliveries (
  id bigint generated always as identity primary key,
  business_id uuid not null references public.businesses (id) on delete cascade,
  appointment_id uuid,
  subscription_id uuid references public.customer_push_subscriptions (id) on delete set null,
  kind text not null check (kind in ('test', 'reminder_24h', 'reminder_2h')),
  status text not null check (status in ('sent', 'failed', 'expired')),
  http_status integer,
  created_at timestamptz not null default now()
);
create index customer_push_deliveries_created_idx on public.customer_push_deliveries (created_at desc);
alter table public.customer_push_deliveries enable row level security;
-- No policies: service role only (admin metrics).

-- Every 15 minutes: reminders 1 day and 2 hours before (the route is idempotent).
do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'cron') then
    perform cron.schedule('customer-reminders', '*/15 * * * *',
      $cron$select private.call_cron('customer-reminders')$cron$);
  end if;
end;
$$;
