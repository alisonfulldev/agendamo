-- /demo is the local demo control page (an app route, so a business page there would be unreachable).
insert into public.reserved_slugs (slug) values ('demo') on conflict do nothing;
