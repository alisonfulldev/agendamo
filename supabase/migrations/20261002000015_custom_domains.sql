-- Prompt 38: resolve a verified custom domain to its business (used by the proxy with the anon key).

create function public.get_custom_domain(p_domain text)
returns table (slug text, brand_key text)
language sql
stable
security definer
set search_path = ''
as $$
  select b.slug, b.brand_key
  from public.custom_domains d
  join public.businesses b on b.id = d.business_id
  where d.domain = lower(p_domain) and d.verified and b.suspended_at is null;
$$;

revoke execute on function public.get_custom_domain(text) from public;
grant execute on function public.get_custom_domain(text) to anon, authenticated, service_role;
