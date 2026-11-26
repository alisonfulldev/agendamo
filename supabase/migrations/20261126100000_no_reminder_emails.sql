-- Decision 2026-11-26: no 24h reminder e-mail to customers (it used up the e-mail quota). The
-- reminder is the customer's own phone calendar ("Salvar na agenda do celular", alarms 1 day and
-- 2 hours before). The scheduled job and its route are gone.
do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'cron')
     and exists (select 1 from cron.job where jobname = 'reminders') then
    perform cron.unschedule('reminders');
  end if;
end;
$$;
