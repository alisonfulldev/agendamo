-- Prompt 12: daily stats consolidation and pg_cron + pg_net jobs for every /api/cron/* route.

-- ---------------------------------------------------------------------------
-- Stats consolidation (idempotent: recomputes whole days from raw events)
-- ---------------------------------------------------------------------------

/**
 * Rebuilds page_stats_daily for local dates (business timezone) from p_since on.
 * Running it twice gives the same result.
 */
create function public.refresh_page_stats(p_since date)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_rows integer;
begin
  with events as (
    select e.business_id,
           (e.occurred_at at time zone b.timezone)::date as day,
           e.type,
           e.outside_hours
    from public.page_events e
    join public.businesses b on b.id = e.business_id
    where e.occurred_at >= (p_since - 1)::timestamptz
  ),
  per_type as (
    select business_id, day, type,
           count(*) as total,
           count(*) filter (where outside_hours) as outside
    from events
    where day >= p_since
    group by business_id, day, type
  ),
  per_day as (
    select business_id, day,
           jsonb_object_agg(type, total) as counts,
           jsonb_object_agg(type, outside) filter (where outside > 0) as outside_hours
    from per_type
    group by business_id, day
  )
  insert into public.page_stats_daily as s (business_id, date, counts, outside_hours, updated_at)
  select business_id, day, counts, coalesce(outside_hours, '{}'::jsonb), now()
  from per_day
  on conflict (business_id, date) do update
    set counts = excluded.counts, outside_hours = excluded.outside_hours, updated_at = now();
  get diagnostics v_rows = row_count;
  return v_rows;
end;
$$;

/** Raw events older than 180 days are deleted once consolidated. */
create function public.purge_page_events()
returns integer
language sql
security definer
set search_path = ''
as $$
  with deleted as (
    delete from public.page_events where occurred_at < now() - interval '180 days' returning 1
  )
  select count(*)::integer from deleted;
$$;

revoke execute on function public.refresh_page_stats(date) from public, anon, authenticated;
revoke execute on function public.purge_page_events() from public, anon, authenticated;
grant execute on function public.refresh_page_stats(date) to service_role;
grant execute on function public.purge_page_events() to service_role;

-- ---------------------------------------------------------------------------
-- Scheduled jobs
-- ---------------------------------------------------------------------------

-- Supabase: enable pg_cron and pg_net (skipped where unavailable, e.g. the local test database).
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
  end if;
  if exists (select 1 from pg_available_extensions where name = 'pg_net') then
    create extension if not exists pg_net with schema extensions;
  end if;
end;
$$;

/**
 * Where the jobs call and with which secret. Filled once after `supabase db push`:
 *   insert into private.cron_settings (key, value) values
 *     ('app_url', 'https://seu-dominio-principal.com.br'),
 *     ('cron_secret', '<mesmo valor de CRON_SECRET na Vercel>');
 */
create table private.cron_settings (
  key text primary key check (key in ('app_url', 'cron_secret')),
  value text not null
);
revoke all on private.cron_settings from anon, authenticated;

/** POSTs to /api/cron/<path> with the shared secret. No-op until cron_settings is filled. */
create function private.call_cron(p_path text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_url text := (select value from private.cron_settings where key = 'app_url');
  v_secret text := (select value from private.cron_settings where key = 'cron_secret');
begin
  if v_url is null or v_secret is null then
    raise notice 'cron_settings not configured; skipping %', p_path;
    return;
  end if;
  perform net.http_post(
    url := rtrim(v_url, '/') || '/api/cron/' || p_path,
    body := '{}'::jsonb,
    headers := jsonb_build_object('Authorization', 'Bearer ' || v_secret, 'Content-Type', 'application/json'),
    timeout_milliseconds := 30000
  );
end;
$$;

-- Times in UTC (Brasília = UTC-3). Every route is idempotent (rule 8).
select cron.schedule('stats',          '5 * * * *',    $$select private.call_cron('stats')$$);          -- hourly :05
select cron.schedule('reminders',      '15 * * * *',   $$select private.call_cron('reminders')$$);      -- hourly :15
select cron.schedule('deposits',       '*/5 * * * *',  $$select private.call_cron('deposits')$$);       -- every 5 min
select cron.schedule('daily-alert',    '30 11 * * *',  $$select private.call_cron('daily-alert')$$);    -- 08:30 BRT
select cron.schedule('trial',          '0 12 * * *',   $$select private.call_cron('trial')$$);          -- 09:00 BRT
select cron.schedule('marketing',      '30 12 * * *',  $$select private.call_cron('marketing')$$);      -- 09:30 BRT (return/birthday)
select cron.schedule('weekly-summary', '0 11 * * 1',   $$select private.call_cron('weekly-summary')$$); -- Mon 08:00 BRT
select cron.schedule('empty-slots',    '0 19 * * *',   $$select private.call_cron('empty-slots')$$);    -- 16:00 BRT
select cron.schedule('portal-stats',   '0 4 * * *',    $$select private.call_cron('portal-stats')$$);   -- 01:00 BRT
select cron.schedule('cleanup',        '0 6 * * *',    $$select private.call_cron('cleanup')$$);        -- 03:00 BRT
