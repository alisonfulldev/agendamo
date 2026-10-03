-- Prompts 15–17: atomic booking operations and plan limits. All service-role only:
-- the server checks permissions and plan features before calling them.

/**
 * Finds the customer by phone in the business or creates one. Never downgrades marketing opt-in
 * (opting out happens through the unsubscribe link).
 */
create function public.upsert_customer(
  p_business_id uuid,
  p_name text,
  p_phone text,
  p_email text default null,
  p_marketing_opt_in boolean default false,
  p_referred_by uuid default null
)
returns table (id uuid, blocked boolean, no_show_count integer, created boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_customer public.customers;
begin
  select * into v_customer from public.customers c
  where c.business_id = p_business_id and c.phone = p_phone
  for update;

  if found then
    update public.customers c
    set email = coalesce(c.email, nullif(p_email, '')),
        marketing_opt_in = c.marketing_opt_in or p_marketing_opt_in
    where c.id = v_customer.id;
    return query select v_customer.id, v_customer.blocked, v_customer.no_show_count, false;
    return;
  end if;

  insert into public.customers (business_id, name, phone, email, marketing_opt_in, referred_by_customer_id)
  values (p_business_id, p_name, p_phone, nullif(p_email, ''), p_marketing_opt_in, p_referred_by)
  returning * into v_customer;
  return query select v_customer.id, v_customer.blocked, v_customer.no_show_count, true;
end;
$$;

/**
 * Inserts an appointment with its services and resource reservations in one transaction.
 * Overlaps raise exclusion_violation (23P01) from appointments_no_overlap or
 * appointment_resources_no_overlap, and nothing is written.
 *
 * p: { business_id, professional_id, customer_id, starts_at, ends_at, status, source,
 *      deposit_cents?, deposit_status?, deposit_expires_at?, coupon_code?, referral_code?, package_id?,
 *      services: [{ service_id, name, duration_minutes, price_cents }],
 *      resources: [{ resource_id, starts_at, ends_at }] }
 */
create function public.book_appointment(p jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  insert into public.appointments (
    business_id, professional_id, customer_id, starts_at, ends_at, status, source,
    deposit_cents, deposit_status, deposit_expires_at, coupon_code, referral_code, package_id
  ) values (
    (p ->> 'business_id')::uuid, (p ->> 'professional_id')::uuid, (p ->> 'customer_id')::uuid,
    (p ->> 'starts_at')::timestamptz, (p ->> 'ends_at')::timestamptz, p ->> 'status', p ->> 'source',
    coalesce((p ->> 'deposit_cents')::integer, 0), coalesce(p ->> 'deposit_status', 'none'),
    (p ->> 'deposit_expires_at')::timestamptz, p ->> 'coupon_code', p ->> 'referral_code',
    (p ->> 'package_id')::uuid
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

/** Moves an appointment (time and/or professional) together with its resource reservations. */
create function public.reschedule_appointment(
  p_appointment_id uuid,
  p_professional_id uuid,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_resources jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_business_id uuid;
begin
  select business_id into v_business_id from public.appointments where id = p_appointment_id for update;
  if v_business_id is null then
    raise exception 'appointment not found' using errcode = 'P0002';
  end if;

  delete from public.appointment_resources where appointment_id = p_appointment_id;
  update public.appointments
  set professional_id = p_professional_id, starts_at = p_starts_at, ends_at = p_ends_at
  where id = p_appointment_id;

  insert into public.appointment_resources (business_id, appointment_id, resource_id, starts_at, ends_at)
  select v_business_id, p_appointment_id, (r ->> 'resource_id')::uuid,
         (r ->> 'starts_at')::timestamptz, (r ->> 'ends_at')::timestamptz
  from jsonb_array_elements(coalesce(p_resources, '[]'::jsonb)) as r;
end;
$$;

/**
 * Enforces a plan's limits without deleting anything: photos beyond the limit become hidden and
 * professionals beyond the limit inactive (lowest positions are kept). Idempotent.
 */
create function public.apply_plan_limits(p_business_id uuid, p_plan text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.page_photos ph
  set hidden = true
  where ph.business_id = p_business_id
    and not ph.hidden
    and ph.id not in (
      select keep.id from public.page_photos keep
      where keep.business_id = p_business_id and not keep.hidden
      order by keep.position, keep.created_at
      limit public.photo_limit(p_plan)
    );

  update public.professionals pr
  set active = false
  where pr.business_id = p_business_id
    and pr.active
    and pr.id not in (
      select keep.id from public.professionals keep
      where keep.business_id = p_business_id and keep.active
      order by keep.position, keep.created_at
      limit public.professional_limit(p_plan)
    );
end;
$$;

revoke execute on function public.upsert_customer(uuid, text, text, text, boolean, uuid) from public, anon, authenticated;
revoke execute on function public.book_appointment(jsonb) from public, anon, authenticated;
revoke execute on function public.reschedule_appointment(uuid, uuid, timestamptz, timestamptz, jsonb) from public, anon, authenticated;
revoke execute on function public.apply_plan_limits(uuid, text) from public, anon, authenticated;
grant execute on function public.upsert_customer(uuid, text, text, text, boolean, uuid) to service_role;
grant execute on function public.book_appointment(jsonb) to service_role;
grant execute on function public.reschedule_appointment(uuid, uuid, timestamptz, timestamptz, jsonb) to service_role;
grant execute on function public.apply_plan_limits(uuid, text) to service_role;
