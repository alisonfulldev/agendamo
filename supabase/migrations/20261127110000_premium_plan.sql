-- Premium (2026-11-27): R$ 64,90/mês or R$ 649/ano. Everything of "Site + Agenda" plus the
-- deposit by Pix with the receipt read automatically and the reminders by notification. Completo
-- and Site + Agenda no longer have deposits or reminders. The trial is the Premium.
alter table public.businesses drop constraint businesses_plan_tier_check;
alter table public.businesses add constraint businesses_plan_tier_check
  check (plan_tier in ('complete', 'site', 'web', 'premium'));
alter table public.subscriptions drop constraint subscriptions_tier_check;
alter table public.subscriptions add constraint subscriptions_tier_check
  check (tier in ('complete', 'site', 'web', 'premium'));
alter table public.subscriptions drop constraint subscriptions_next_tier_check;
alter table public.subscriptions add constraint subscriptions_next_tier_check
  check (next_tier is null or next_tier in ('complete', 'site', 'web', 'premium'));
alter table public.assisted_sales drop constraint assisted_sales_tier_check;
alter table public.assisted_sales add constraint assisted_sales_tier_check
  check (tier in ('complete', 'site', 'web', 'premium'));

-- Subscriptions from before the Premium do not renew: they run until the paid period ends and
-- then the owner chooses a plan again (a new Pix Automático authorization, by the first QR).
-- Set by Admin › Assinaturas antigas; the notices 7, 3 and 1 day before use notification_log.
alter table public.subscriptions add column sunset_at timestamptz;
