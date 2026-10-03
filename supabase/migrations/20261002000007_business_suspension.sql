-- Prompt 22 (admin) support: suspended businesses disappear from every public read.

alter table public.businesses add column suspended_at timestamptz;

create or replace function public.get_public_business(p_slug text)
returns table (
  id uuid,
  name text,
  slug text,
  brand_key text,
  segment text,
  timezone text,
  plan text,
  trial_ends_at timestamptz,
  slot_interval_minutes integer,
  min_notice_minutes integer,
  max_days_ahead integer,
  booking_confirmation text
)
language sql
stable
security definer
set search_path = ''
as $$
  select b.id, b.name, b.slug, b.brand_key, b.segment, b.timezone, b.plan, b.trial_ends_at,
         b.slot_interval_minutes, b.min_notice_minutes, b.max_days_ahead, b.booking_confirmation
  from public.businesses b
  where b.slug = lower(p_slug) and b.suspended_at is null;
$$;

-- Wrap get_public_page: same body, filtered by suspension.
alter function public.get_public_page(text) rename to get_public_page_unfiltered;
revoke execute on function public.get_public_page_unfiltered(text) from anon, authenticated;

create function public.get_public_page(p_slug text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when exists (select 1 from public.businesses b where b.slug = lower(p_slug) and b.suspended_at is null)
      then public.get_public_page_unfiltered(p_slug)
    else null
  end;
$$;

revoke execute on function public.get_public_page(text) from public;
grant execute on function public.get_public_page(text) to anon, authenticated, service_role;
