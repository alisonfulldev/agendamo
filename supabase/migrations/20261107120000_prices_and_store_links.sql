-- "Site + Agenda" goes from R$ 49 to R$ 39 a month (R$ 390 a year) on 2026-11-07. Subscribers pay
-- the new value from the next charge: the billing job updates the Asaas subscription (needs_reprice;
-- with Pix Automático active, the next charge goes by QR and authorizes the new value).
update public.subscriptions
set needs_reprice = true, updated_at = now()
where tier = 'site' and status in ('pending', 'active', 'overdue');

-- "Site ou Loja" (2026-11-07): a product can link to where it is sold (Shopee, Mercado Livre, its
-- own shop…) instead of the WhatsApp bag.
alter table public.catalog_items
  add column link_url text check (link_url is null or (char_length(link_url) <= 500 and link_url ~ '^https://'));
