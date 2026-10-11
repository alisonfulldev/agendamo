-- One plan (Completo) with a 14-day trial and waiting mode (2026-10-12).
-- businesses.plan: "free" = no subscription (trial or waiting mode), "complete" = subscribed.
-- trial_plan, signup_choice and subscriptions.pending_plan stay as history and are no longer used.

-- Subscribers (Agenda, Pro, legacy Team) become Completo, keeping their dates.
alter table public.businesses drop constraint if exists businesses_plan_check;
update public.businesses set plan = 'complete' where plan in ('agenda', 'pro', 'team');
alter table public.businesses
  add constraint businesses_plan_check check (plan in ('free', 'complete'));

alter table public.subscriptions drop constraint if exists subscriptions_plan_check;
update public.subscriptions set plan = 'complete', pending_plan = null;
alter table public.subscriptions
  add constraint subscriptions_plan_check check (plan = 'complete');

-- The Asaas value of open subscriptions changes to the Completo price from the next charge
-- (the daily billing job applies it).
update public.subscriptions
set needs_reprice = true
where status in ('pending', 'active', 'overdue') and provider_subscription_id is not null;

-- Accounts without a subscription (Grátis or in the 7-day trial) get 14 days of Completo from now,
-- with a one-time e-mail about the change (sent by the trial cron).
alter table public.businesses
  add column plan_change_notice_pending boolean not null default false;

update public.businesses
set trial_started_at = now(),
    trial_ends_at = now() + interval '14 days',
    plan_change_notice_pending = true
where plan = 'free';

-- Waiting mode: count of customers sent to WhatsApp by the chat (anonymous, like the other events).
alter table public.page_events drop constraint if exists page_events_type_check;
alter table public.page_events
  add constraint page_events_type_check check (type in (
    'view', 'click_whatsapp', 'click_instagram', 'click_link', 'click_book',
    'request_started', 'request_sent', 'booking_started', 'booking_confirmed', 'handoff_sent'
  ));
