-- Prompt 37: demand radar. Monthly aggregates rebuilt from portal_events (idempotent).

create table public.portal_business_stats_monthly (
  business_id uuid not null references public.businesses (id) on delete cascade,
  month date not null check (extract(day from month) = 1),
  appearances integer not null default 0,
  clicks integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (business_id, month)
);

create table public.portal_hourly_monthly (
  brand_key text not null,
  city text not null default '',
  service_slug text not null default '',
  month date not null check (extract(day from month) = 1),
  hour smallint not null check (hour between 0 and 23),
  searches integer not null default 0,
  primary key (brand_key, city, service_slug, month, hour)
);

alter table public.portal_business_stats_monthly enable row level security;
alter table public.portal_hourly_monthly enable row level security;
create policy "owner reads own portal stats" on public.portal_business_stats_monthly
  for select to authenticated using (private.is_owner(business_id));
-- portal_stats_monthly / portal_hourly_monthly: read by the server only (aggregated, shown with the <5 rule).

/** Rebuilds the month containing p_day. Hours use São Paulo time (portal audience). */
create function public.refresh_portal_stats(p_day date)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_month date := date_trunc('month', p_day)::date;
  v_from timestamptz := v_month::timestamptz;
  v_to timestamptz := (v_month + interval '1 month')::timestamptz;
begin
  delete from public.portal_stats_monthly where month = v_month;
  insert into public.portal_stats_monthly (brand_key, city, neighborhood, service_slug, month, searches, views, clicks)
  select brand_key, coalesce(city, ''), coalesce(neighborhood, ''), coalesce(service_slug, ''), v_month,
         count(*) filter (where type = 'search'),
         count(distinct session_id) filter (where type = 'view'),
         count(*) filter (where type = 'click')
  from public.portal_events
  where occurred_at >= v_from and occurred_at < v_to
  group by 1, 2, 3, 4;

  delete from public.portal_business_stats_monthly where month = v_month;
  insert into public.portal_business_stats_monthly (business_id, month, appearances, clicks)
  select business_id, v_month, count(*) filter (where type = 'view'), count(*) filter (where type = 'click')
  from public.portal_events
  where business_id is not null and occurred_at >= v_from and occurred_at < v_to
  group by business_id;

  delete from public.portal_hourly_monthly where month = v_month;
  insert into public.portal_hourly_monthly (brand_key, city, service_slug, month, hour, searches)
  select brand_key, coalesce(city, ''), coalesce(service_slug, ''), v_month,
         extract(hour from occurred_at at time zone 'America/Sao_Paulo')::smallint, count(distinct session_id)
  from public.portal_events
  where type in ('search', 'view') and occurred_at >= v_from and occurred_at < v_to
  group by 1, 2, 3, 4, 5;

  return jsonb_build_object('month', v_month);
end;
$$;

revoke execute on function public.refresh_portal_stats(date) from public, anon, authenticated;
grant execute on function public.refresh_portal_stats(date) to service_role;
