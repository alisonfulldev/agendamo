-- Prompts 21/36: portal listings and SEO rules (rule 12: only pages with minimum content are indexed).

create extension if not exists unaccent with schema extensions;

insert into public.reserved_slugs (slug) values ('icons'), ('og'), ('sw'), ('manifest-webmanifest'), ('agendamento')
on conflict do nothing;

/** "São Paulo" -> "sao-paulo" (same rule as src/lib/slug.ts). */
create function public.portal_slug(p_value text)
returns text
language sql
stable
set search_path = ''
as $$
  select trim(both '-' from regexp_replace(lower(extensions.unaccent(coalesce(p_value, ''))), '[^a-z0-9]+', '-', 'g'));
$$;

/**
 * Complete profile: photo, description (30+ chars) and 3+ active services with price.
 * Suspended businesses and those that left the portal are excluded.
 */
create function public.complete_businesses(p_brand_key text)
returns table (
  id uuid, slug text, name text, avatar_key text, bio text, city text, neighborhood text,
  city_slug text, neighborhood_slug text, updated_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select b.id, b.slug, b.name, s.avatar_key, s.bio, s.city, s.neighborhood,
         public.portal_slug(s.city), public.portal_slug(s.neighborhood), s.updated_at
  from public.businesses b
  join public.page_settings s on s.business_id = b.id
  where b.brand_key = p_brand_key
    and b.suspended_at is null
    and not b.portal_opt_out
    and s.avatar_key is not null
    and char_length(coalesce(s.bio, '')) >= 30
    and coalesce(s.city, '') <> ''
    and (select count(*) from public.services sv where sv.business_id = b.id and sv.active and sv.price_cents > 0) >= 3;
$$;

create function public.indexable_businesses(p_brand_key text)
returns table (slug text, updated_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select c.slug, c.updated_at from public.complete_businesses(p_brand_key) c;
$$;

/** Service slugs offered by complete businesses (for listings, search and sitemap). */
create function public.portal_offers(p_brand_key text)
returns table (business_id uuid, city_slug text, neighborhood_slug text, service_slug text, service_name text, price_cents integer)
language sql
stable
security definer
set search_path = ''
as $$
  select c.id, c.city_slug, c.neighborhood_slug, public.portal_slug(sv.name), sv.name, sv.price_cents
  from public.complete_businesses(p_brand_key) c
  join public.services sv on sv.business_id = c.id and sv.active and sv.price_cents > 0;
$$;

/** Listing pages (city+service and city+neighborhood+service) with at least 3 complete businesses. */
create function public.indexable_portal_pages(p_brand_key text)
returns table (path text)
language sql
stable
security definer
set search_path = ''
as $$
  select '/explorar/' || city_slug || '/' || service_slug
  from public.portal_offers(p_brand_key)
  group by city_slug, service_slug
  having count(distinct business_id) >= 3
  union all
  select '/explorar/' || city_slug || '/' || neighborhood_slug || '/' || service_slug
  from public.portal_offers(p_brand_key)
  where neighborhood_slug <> ''
  group by city_slug, neighborhood_slug, service_slug
  having count(distinct business_id) >= 3;
$$;

/** Businesses of a listing: featured (active add-on for the city) first, then rating. */
create function public.portal_listing(p_brand_key text, p_city_slug text, p_service_slug text, p_neighborhood_slug text default null)
returns table (
  slug text, name text, avatar_key text, city text, neighborhood text, bio text,
  min_price_cents integer, rating numeric, reviews integer, professionals integer, featured boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select c.slug, c.name, c.avatar_key, c.city, c.neighborhood, c.bio,
         min(o.price_cents)::integer,
         (select round(avg(r.rating)::numeric, 1) from public.reviews r where r.business_id = c.id and not r.hidden),
         (select count(*)::integer from public.reviews r where r.business_id = c.id and not r.hidden),
         (select count(*)::integer from public.professionals p where p.business_id = c.id and p.active),
         exists (
           select 1 from public.portal_featured f
           where f.business_id = c.id and public.portal_slug(f.city) = p_city_slug and f.active_until > now()
         )
  from public.complete_businesses(p_brand_key) c
  join public.portal_offers(p_brand_key) o on o.business_id = c.id
  where c.city_slug = p_city_slug
    and o.service_slug = p_service_slug
    and (p_neighborhood_slug is null or c.neighborhood_slug = p_neighborhood_slug)
  group by c.id, c.slug, c.name, c.avatar_key, c.city, c.neighborhood, c.bio
  order by 11 desc, 8 desc nulls last, 9 desc, c.name;
$$;

/** Cities and services available in a brand's portal (search page, internal links). */
create function public.portal_index(p_brand_key text)
returns table (city_slug text, city text, service_slug text, service_name text, businesses integer)
language sql
stable
security definer
set search_path = ''
as $$
  select o.city_slug, min(c.city), o.service_slug, min(o.service_name), count(distinct o.business_id)::integer
  from public.portal_offers(p_brand_key) o
  join public.complete_businesses(p_brand_key) c on c.id = o.business_id
  group by o.city_slug, o.service_slug
  order by 5 desc, 2, 4;
$$;

/** Recent visible reviews of a listing's businesses (unique page content). */
create function public.portal_recent_reviews(p_brand_key text, p_city_slug text, p_service_slug text)
returns table (business_name text, rating smallint, comment text, created_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select c.name, r.rating, r.comment, r.created_at
  from public.complete_businesses(p_brand_key) c
  join public.reviews r on r.business_id = c.id and not r.hidden and r.comment is not null
  where c.city_slug = p_city_slug
    and exists (select 1 from public.portal_offers(p_brand_key) o where o.business_id = c.id and o.service_slug = p_service_slug)
  order by r.created_at desc
  limit 5;
$$;

do $$
declare
  fn text;
begin
  foreach fn in array array[
    'complete_businesses(text)', 'indexable_businesses(text)', 'portal_offers(text)', 'indexable_portal_pages(text)',
    'portal_listing(text, text, text, text)', 'portal_index(text)', 'portal_recent_reviews(text, text, text)'
  ] loop
    execute format('revoke execute on function public.%s from public', fn);
    execute format('grant execute on function public.%s to anon, authenticated, service_role', fn);
  end loop;
end;
$$;
