-- Prompts 17/33: business coupons redeemed inside the booking transaction, so a failed booking
-- never consumes a coupon use.

alter table public.appointments add column discount_cents integer not null default 0 check (discount_cents >= 0);

/** Discount a coupon gives on p_amount (cents), or null when the coupon is unknown/expired/used up. */
create function public.preview_business_coupon(p_business_id uuid, p_code text, p_amount integer)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select least(
    p_amount,
    case c.discount_type when 'percent' then round(p_amount * c.discount_value / 100.0)::integer else c.discount_value end
  )
  from public.business_coupons c
  where c.business_id = p_business_id
    and c.code = upper(trim(p_code))
    and (c.valid_until is null or c.valid_until > now())
    and (c.max_uses is null or c.uses < c.max_uses);
$$;

create or replace function public.book_appointment(p jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_code text := nullif(upper(trim(coalesce(p ->> 'coupon_code', ''))), '');
begin
  if v_code is not null then
    update public.business_coupons c
    set uses = c.uses + 1
    where c.business_id = (p ->> 'business_id')::uuid
      and c.code = v_code
      and (c.valid_until is null or c.valid_until > now())
      and (c.max_uses is null or c.uses < c.max_uses);
    if not found then
      raise exception 'coupon_invalid' using errcode = 'P0001';
    end if;
  end if;

  insert into public.appointments (
    business_id, professional_id, customer_id, starts_at, ends_at, status, source,
    deposit_cents, deposit_status, deposit_expires_at, coupon_code, discount_cents, referral_code, package_id
  ) values (
    (p ->> 'business_id')::uuid, (p ->> 'professional_id')::uuid, (p ->> 'customer_id')::uuid,
    (p ->> 'starts_at')::timestamptz, (p ->> 'ends_at')::timestamptz, p ->> 'status', p ->> 'source',
    coalesce((p ->> 'deposit_cents')::integer, 0), coalesce(p ->> 'deposit_status', 'none'),
    (p ->> 'deposit_expires_at')::timestamptz, v_code, coalesce((p ->> 'discount_cents')::integer, 0),
    p ->> 'referral_code', (p ->> 'package_id')::uuid
  )
  returning id into v_id;

  insert into public.appointment_services (business_id, appointment_id, service_id, name, duration_minutes, price_cents, position)
  select (p ->> 'business_id')::uuid, v_id, (s ->> 'service_id')::uuid, s ->> 'name',
         (s ->> 'duration_minutes')::integer, (s ->> 'price_cents')::integer, (ord - 1)::integer
  from jsonb_array_elements(p -> 'services') with ordinality as t(s, ord);

  insert into public.appointment_resources (business_id, appointment_id, resource_id, starts_at, ends_at)
  select (p ->> 'business_id')::uuid, v_id, (r ->> 'resource_id')::uuid,
         (r ->> 'starts_at')::timestamptz, (r ->> 'ends_at')::timestamptz
  from jsonb_array_elements(coalesce(p -> 'resources', '[]'::jsonb)) as r;

  return v_id;
end;
$$;

revoke execute on function public.preview_business_coupon(uuid, text, integer) from public, anon, authenticated;
grant execute on function public.preview_business_coupon(uuid, text, integer) to service_role;
