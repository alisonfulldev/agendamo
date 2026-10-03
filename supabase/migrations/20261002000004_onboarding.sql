-- Prompt 6: atomic business creation for the onboarding wizard (service role only).

/**
 * Creates business + owner membership + default professional + page settings + services
 * (linked to the professional) + working hours, all or nothing. Returns the business id.
 *
 * p_payload: {
 *   name, slug, brand_key, segment, timezone?,
 *   page: { whatsapp_number?, instagram_url?, address?, city?, neighborhood? },
 *   services: [{ name, duration_minutes, price_cents }],
 *   hours: [{ weekday, start_time, end_time }]
 * }
 */
create function public.create_business(p_user_id uuid, p_payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_business_id uuid;
  v_professional_id uuid;
  v_service jsonb;
  v_service_id uuid;
  v_position integer := 0;
begin
  if exists (select 1 from public.members m where m.user_id = p_user_id) then
    raise exception 'user already has a business' using errcode = '23505';
  end if;
  if jsonb_array_length(coalesce(p_payload -> 'services', '[]'::jsonb)) = 0 then
    raise exception 'at least one service is required' using errcode = '23514';
  end if;

  insert into public.businesses (name, slug, brand_key, segment, timezone)
  values (
    p_payload ->> 'name',
    p_payload ->> 'slug',
    p_payload ->> 'brand_key',
    p_payload ->> 'segment',
    coalesce(p_payload ->> 'timezone', 'America/Sao_Paulo')
  )
  returning id into v_business_id;

  insert into public.professionals (business_id, name, position)
  values (v_business_id, p_payload ->> 'name', 0)
  returning id into v_professional_id;

  insert into public.members (business_id, user_id, role) values (v_business_id, p_user_id, 'owner');

  insert into public.page_settings (business_id, whatsapp_number, instagram_url, address, city, neighborhood)
  values (
    v_business_id,
    nullif(p_payload -> 'page' ->> 'whatsapp_number', ''),
    nullif(p_payload -> 'page' ->> 'instagram_url', ''),
    nullif(p_payload -> 'page' ->> 'address', ''),
    nullif(p_payload -> 'page' ->> 'city', ''),
    nullif(p_payload -> 'page' ->> 'neighborhood', '')
  );

  for v_service in select * from jsonb_array_elements(p_payload -> 'services') loop
    insert into public.services (business_id, name, duration_minutes, price_cents, position)
    values (
      v_business_id,
      v_service ->> 'name',
      (v_service ->> 'duration_minutes')::integer,
      coalesce((v_service ->> 'price_cents')::integer, 0),
      v_position
    )
    returning id into v_service_id;
    insert into public.professional_services (business_id, professional_id, service_id)
    values (v_business_id, v_professional_id, v_service_id);
    v_position := v_position + 1;
  end loop;

  insert into public.working_hours (business_id, professional_id, weekday, start_time, end_time)
  select v_business_id, v_professional_id, (h ->> 'weekday')::smallint, (h ->> 'start_time')::time, (h ->> 'end_time')::time
  from jsonb_array_elements(coalesce(p_payload -> 'hours', '[]'::jsonb)) as h;

  insert into public.audit_log (business_id, user_id, action, details)
  values (v_business_id, p_user_id, 'business.created', jsonb_build_object('slug', p_payload ->> 'slug'));

  return v_business_id;
end;
$$;

revoke execute on function public.create_business(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.create_business(uuid, jsonb) to service_role;
