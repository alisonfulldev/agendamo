-- Prompt 30: per-customer activity for reactivation, "hora de voltar" and birthdays.

/**
 * Last completed visit, its main service (with return_after_days) and whether a future active
 * appointment exists. Service role only (the server checks the owner first).
 */
create function public.customer_activity(p_business_id uuid)
returns table (
  customer_id uuid,
  name text,
  phone text,
  email text,
  birthdate date,
  marketing_opt_in boolean,
  blocked boolean,
  last_appointment_id uuid,
  last_completed_at timestamptz,
  last_service_id uuid,
  last_service_name text,
  return_after_days integer,
  has_future boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select c.id, c.name, c.phone, c.email, c.birthdate, c.marketing_opt_in, c.blocked,
         last.id, last.starts_at, last.service_id, last.service_name, last.return_after_days,
         exists (
           select 1 from public.appointments f
           where f.customer_id = c.id and f.starts_at > now()
             and f.status in ('confirmed', 'pending', 'awaiting_deposit')
         )
  from public.customers c
  left join lateral (
    select a.id, a.starts_at, s.id as service_id, aps.name as service_name, s.return_after_days
    from public.appointments a
    left join lateral (
      select x.service_id, x.name from public.appointment_services x
      where x.appointment_id = a.id order by x.position limit 1
    ) aps on true
    left join public.services s on s.id = aps.service_id
    where a.customer_id = c.id and a.status = 'completed'
    order by a.starts_at desc
    limit 1
  ) last on true
  where c.business_id = p_business_id;
$$;

revoke execute on function public.customer_activity(uuid) from public, anon, authenticated;
grant execute on function public.customer_activity(uuid) to service_role;
