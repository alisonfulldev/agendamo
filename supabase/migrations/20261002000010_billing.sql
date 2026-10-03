-- Prompt 19: billing support. Webhook idempotency and atomic platform coupon redemption.

/** Asaas delivers webhooks "at least once": each event id is processed only once. */
create table public.webhook_events (
  id text primary key,
  provider text not null default 'asaas',
  event text not null,
  received_at timestamptz not null default now()
);
alter table public.webhook_events enable row level security;
-- No policies: service role only.

/**
 * Uses one redemption of a platform coupon valid for the brand (brand_key null = any brand).
 * Returns the discount percent, or null when invalid. Atomic (concurrent checkouts are safe).
 */
create function public.redeem_platform_coupon(p_code text, p_brand_key text)
returns integer
language sql
security definer
set search_path = ''
as $$
  update public.platform_coupons c
  set uses = c.uses + 1
  where c.code = upper(trim(p_code))
    and (c.brand_key is null or c.brand_key = p_brand_key)
    and (c.valid_until is null or c.valid_until > now())
    and (c.max_uses is null or c.uses < c.max_uses)
  returning c.discount_percent;
$$;

/** Discount percent without using the coupon (to show the price before checkout). */
create function public.preview_platform_coupon(p_code text, p_brand_key text)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select c.discount_percent from public.platform_coupons c
  where c.code = upper(trim(p_code))
    and (c.brand_key is null or c.brand_key = p_brand_key)
    and (c.valid_until is null or c.valid_until > now())
    and (c.max_uses is null or c.uses < c.max_uses);
$$;

revoke execute on function public.redeem_platform_coupon(text, text) from public, anon, authenticated;
revoke execute on function public.preview_platform_coupon(text, text) from public, anon, authenticated;
grant execute on function public.redeem_platform_coupon(text, text) to service_role;
grant execute on function public.preview_platform_coupon(text, text) to service_role;
