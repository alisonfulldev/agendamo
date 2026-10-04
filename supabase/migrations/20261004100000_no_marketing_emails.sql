-- Decision 2026-10-04: no marketing e-mails ("hora de voltar" / birthday). Only account, password,
-- booking and billing e-mails remain. The scheduled job and its route are gone.
do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'cron')
     and exists (select 1 from cron.job where jobname = 'marketing') then
    perform cron.unschedule('marketing');
  end if;
end;
$$;

update public.marketing_settings set return_email_enabled = false, birthday_email_enabled = false;
