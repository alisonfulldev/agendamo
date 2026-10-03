-- Prompt 9: everything the public page shows, in one safe call (no Pix key, no customer data
-- beyond the reviewer's first name).

create function public.get_public_page(p_slug text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'business', jsonb_build_object(
      'id', b.id, 'name', b.name, 'slug', b.slug, 'brand_key', b.brand_key, 'segment', b.segment,
      'timezone', b.timezone, 'plan', b.plan, 'trial_started_at', b.trial_started_at,
      'trial_ends_at', b.trial_ends_at, 'slot_interval_minutes', b.slot_interval_minutes,
      'min_notice_minutes', b.min_notice_minutes, 'max_days_ahead', b.max_days_ahead,
      'booking_confirmation', b.booking_confirmation
    ),
    'page', (
      select jsonb_build_object(
        'bio', s.bio, 'avatar_key', s.avatar_key, 'cover_key', s.cover_key,
        'primary_color_override', s.primary_color_override, 'whatsapp_number', s.whatsapp_number,
        'instagram_url', s.instagram_url, 'address', s.address, 'city', s.city,
        'neighborhood', s.neighborhood, 'show_prices', s.show_prices,
        'has_pix', s.pix_key is not null
      )
      from public.page_settings s where s.business_id = b.id
    ),
    'links', coalesce((
      select jsonb_agg(jsonb_build_object('id', l.id, 'label', l.label, 'url', l.url) order by l.position)
      from public.page_links l where l.business_id = b.id and l.active
    ), '[]'::jsonb),
    'services', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', sv.id, 'name', sv.name, 'description', sv.description,
        'duration_minutes', sv.duration_minutes, 'buffer_minutes', sv.buffer_minutes,
        'price_cents', sv.price_cents, 'deposit_type', sv.deposit_type, 'deposit_value', sv.deposit_value
      ) order by sv.position, sv.name)
      from public.services sv where sv.business_id = b.id and sv.active
    ), '[]'::jsonb),
    'combos', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', c.id, 'name', c.name, 'price_cents', c.price_cents,
        'service_ids', (
          select jsonb_agg(cs.service_id order by cs.position)
          from public.combo_services cs where cs.combo_id = c.id
        )
      ) order by c.created_at)
      from public.combos c
      where c.business_id = b.id and c.active
        -- Only combos whose services are all active.
        and not exists (
          select 1 from public.combo_services cs join public.services sv on sv.id = cs.service_id
          where cs.combo_id = c.id and not sv.active
        )
    ), '[]'::jsonb),
    'professionals', coalesce((
      select jsonb_agg(jsonb_build_object('id', p.id, 'name', p.name, 'photo_key', p.photo_key) order by p.position, p.name)
      from public.professionals p where p.business_id = b.id and p.active
    ), '[]'::jsonb),
    'photos', coalesce((
      select jsonb_agg(jsonb_build_object('id', ph.id, 'key', ph.object_key, 'width', ph.width, 'height', ph.height) order by ph.position)
      from public.page_photos ph where ph.business_id = b.id and not ph.hidden
    ), '[]'::jsonb),
    'reviews', coalesce((
      select jsonb_agg(r order by r.created_at desc)
      from (
        select rv.id, rv.rating, rv.comment, rv.reply, rv.created_at,
               split_part(coalesce(cu.name, ''), ' ', 1) as first_name
        from public.reviews rv
        left join public.customers cu on cu.id = rv.customer_id
        where rv.business_id = b.id and not rv.hidden
        order by rv.created_at desc
        limit 20
      ) r
    ), '[]'::jsonb),
    'rating', (
      select jsonb_build_object('average', round(avg(rv.rating)::numeric, 1), 'count', count(*))
      from public.reviews rv where rv.business_id = b.id and not rv.hidden
    )
  )
  from public.businesses b
  where b.slug = lower(p_slug);
$$;

revoke execute on function public.get_public_page(text) from public;
grant execute on function public.get_public_page(text) to anon, authenticated, service_role;
