-- Portal lists any business with a city and at least one active service (2026-10-05), with or
-- without photo. Google keeps the old rule (rule 12): only complete profiles and listing pages with
-- 3+ complete businesses are indexable; complete profiles also come first in the listings.

/** Businesses shown in the portal; `complete` = photo, 30+ char bio and 3+ priced services. */
create function public.listed_businesses(p_brand_key text)
returns table (
  id uuid, slug text, name text, avatar_key text, bio text, city text, neighborhood text,
  city_slug text, neighborhood_slug text, updated_at timestamptz, complete boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select b.id, b.slug, b.name, s.avatar_key, s.bio, s.city, s.neighborhood,
         public.portal_slug(s.city), public.portal_slug(s.neighborhood), s.updated_at,
         s.avatar_key is not null
           and char_length(coalesce(s.bio, '')) >= 30
           and (select count(*) from public.services sv
                where sv.business_id = b.id and sv.active and sv.price_cents > 0) >= 3
  from public.businesses b
  join public.page_settings s on s.business_id = b.id
  where b.brand_key = p_brand_key
    and b.suspended_at is null
    and not b.portal_opt_out
    and public.portal_slug(s.city) <> ''
    and exists (select 1 from public.services sv where sv.business_id = b.id and sv.active);
$$;

revoke execute on function public.listed_businesses(text) from public;
grant execute on function public.listed_businesses(text) to anon, authenticated, service_role;

/** Services offered by listed businesses (any price; free ones like "Orçamento" count too). */
create or replace function public.portal_offers(p_brand_key text)
returns table (business_id uuid, city_slug text, neighborhood_slug text, service_slug text, service_name text, price_cents integer)
language sql
stable
security definer
set search_path = ''
as $$
  select c.id, c.city_slug, c.neighborhood_slug, public.portal_slug(sv.name), sv.name, sv.price_cents
  from public.listed_businesses(p_brand_key) c
  join public.services sv on sv.business_id = c.id and sv.active;
$$;

/** Indexable listing pages: unchanged rule, at least 3 complete businesses with a priced offer. */
create or replace function public.indexable_portal_pages(p_brand_key text)
returns table (path text)
language sql
stable
security definer
set search_path = ''
as $$
  with offers as (
    select o.* from public.portal_offers(p_brand_key) o
    join public.complete_businesses(p_brand_key) c on c.id = o.business_id
    where o.price_cents > 0
  )
  select '/explorar/' || city_slug || '/' || service_slug
  from offers
  group by city_slug, service_slug
  having count(distinct business_id) >= 3
  union all
  select '/explorar/' || city_slug || '/' || neighborhood_slug || '/' || service_slug
  from offers
  where neighborhood_slug <> ''
  group by city_slug, neighborhood_slug, service_slug
  having count(distinct business_id) >= 3;
$$;

/**
 * Businesses of a listing: featured first, then rating, reviews and complete profiles.
 * min_price_cents = cheapest priced offer of the service (0 when it has no price).
 */
create or replace function public.portal_listing(p_brand_key text, p_city_slug text, p_service_slug text, p_neighborhood_slug text default null)
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
         coalesce(min(nullif(o.price_cents, 0)), 0)::integer,
         (select round(avg(r.rating)::numeric, 1) from public.reviews r where r.business_id = c.id and not r.hidden),
         (select count(*)::integer from public.reviews r where r.business_id = c.id and not r.hidden),
         (select count(*)::integer from public.professionals p where p.business_id = c.id and p.active),
         exists (
           select 1 from public.portal_featured f
           where f.business_id = c.id and public.portal_slug(f.city) = p_city_slug and f.active_until > now()
         )
  from public.listed_businesses(p_brand_key) c
  join public.portal_offers(p_brand_key) o on o.business_id = c.id
  where c.city_slug = p_city_slug
    and o.service_slug = p_service_slug
    and (p_neighborhood_slug is null or c.neighborhood_slug = p_neighborhood_slug)
  group by c.id, c.slug, c.name, c.avatar_key, c.city, c.neighborhood, c.bio, c.complete
  order by 11 desc, 8 desc nulls last, 9 desc, c.complete desc, c.name;
$$;

/** Cities and services available in a brand's portal (search page, internal links). */
create or replace function public.portal_index(p_brand_key text)
returns table (city_slug text, city text, service_slug text, service_name text, businesses integer)
language sql
stable
security definer
set search_path = ''
as $$
  select o.city_slug, min(c.city), o.service_slug, min(o.service_name), count(distinct o.business_id)::integer
  from public.portal_offers(p_brand_key) o
  join public.listed_businesses(p_brand_key) c on c.id = o.business_id
  group by o.city_slug, o.service_slug
  order by 5 desc, 2, 4;
$$;

/** Recent visible reviews of a listing's businesses (unique page content). */
create or replace function public.portal_recent_reviews(p_brand_key text, p_city_slug text, p_service_slug text)
returns table (business_name text, rating smallint, comment text, created_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select c.name, r.rating, r.comment, r.created_at
  from public.listed_businesses(p_brand_key) c
  join public.reviews r on r.business_id = c.id and not r.hidden and r.comment is not null
  where c.city_slug = p_city_slug
    and exists (select 1 from public.portal_offers(p_brand_key) o where o.business_id = c.id and o.service_slug = p_service_slug)
  order by r.created_at desc
  limit 5;
$$;
