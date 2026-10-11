-- Deposit by Pix with an optional receipt (2026-10-13): the customer taps "Já fiz o Pix" and the
-- owner checks the unique-cents amount in the bank. A customer whose Pix the owner marked as
-- "Não recebi" must attach the receipt from then on (in this business).
alter table public.customers
  add column deposit_receipt_required boolean not null default false;
