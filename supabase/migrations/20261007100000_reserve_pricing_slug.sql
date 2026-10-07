-- /precos is a site page (pricing): a business page there would be unreachable.
insert into public.reserved_slugs (slug) values ('precos')
on conflict do nothing;
