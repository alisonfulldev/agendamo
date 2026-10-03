-- Own checkout (Asaas behind the scenes): how the subscription is paid. Only the last digits and
-- the brand of a card are kept; card data and tokens stay at Asaas.

alter table public.subscriptions
  add column billing_type text not null default 'pix' check (billing_type in ('pix', 'credit_card')),
  add column card_last4 text check (card_last4 is null or card_last4 ~ '^[0-9]{4}$'),
  add column card_brand text check (card_brand is null or char_length(card_brand) <= 20);
