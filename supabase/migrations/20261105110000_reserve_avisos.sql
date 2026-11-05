-- /avisos/desligar (owner opt-out of "Novidades e dicas", 2026-11-05) is a route: no business
-- can take "avisos" as its link.
insert into public.reserved_slugs (slug) values ('avisos') on conflict do nothing;
