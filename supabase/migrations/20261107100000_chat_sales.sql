-- Sales chat (2026-11-07): whoever arrives from the WhatsApp gets the link /conheca, a chat that
-- shows the example sites, the plans and the Pix of the first payment (no trial, not public).
-- The sale is the same assisted_sales row, with no seller.

-- Where the sale came from: the admin's "Nova venda" or the sales chat.
alter table public.assisted_sales
  add column source text not null default 'admin' check (source in ('admin', 'chat'));

-- The chat logs the new owner into the panel once, right after paying, on the same device.
alter table public.assisted_sales add column auto_login_at timestamptz;

insert into public.reserved_slugs (slug) values ('conheca') on conflict do nothing;
