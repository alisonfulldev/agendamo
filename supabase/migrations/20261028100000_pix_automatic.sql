-- Subscription paid only by Pix (2026-10-28): Pix Automático (Asaas, journey 3) as the way to pay,
-- the regular Pix QR only as a fallback when the automatic debit does not happen.

alter table public.subscriptions
  -- Latest Pix Automático authorization at Asaas and its state.
  add column pix_automatic_id text check (pix_automatic_id is null or char_length(pix_automatic_id) <= 100),
  add column pix_automatic_status text check (
    pix_automatic_status is null
    or pix_automatic_status in ('created', 'active', 'refused', 'cancelled', 'expired')
  ),
  -- First payment (the QR that also authorizes) already applied to the period: webhooks may
  -- repeat it, and the activation event may come before or after the payment event.
  add column pix_automatic_first_payment_id text check (
    pix_automatic_first_payment_id is null or char_length(pix_automatic_first_payment_id) <= 100
  ),
  -- Recurring value with the coupon applied, to recreate the charge when falling back to the
  -- regular Pix (null on older rows: the price table is used).
  add column value_cents integer check (value_cents is null or value_cents > 0);

create index subscriptions_pix_automatic_id_idx
  on public.subscriptions (pix_automatic_id)
  where pix_automatic_id is not null;

create index subscriptions_provider_customer_id_idx
  on public.subscriptions (provider_customer_id)
  where provider_customer_id is not null;
