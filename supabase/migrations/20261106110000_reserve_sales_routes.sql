-- /exemplo/<ramo> (example sites) and /pagar/<token> (payment page of WhatsApp sales) are routes:
-- no business can take these words as its link (2026-11-06).
insert into public.reserved_slugs (slug) values ('exemplo'), ('pagar') on conflict do nothing;
