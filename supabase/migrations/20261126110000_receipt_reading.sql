-- Receipt reading engine (2026-11-26, OCR + fixed rules, no AI). Uses the columns prepared in
-- 20261011100000_pix_receipts (extraction_status, extracted). Only the result of the checks is
-- stored in `extracted` (amount/recipient/date/reference flags and the reasons), never the text.
alter table public.deposit_receipts
  -- Pix end-to-end id read from the receipt: the same Pix never pays two appointments.
  add column e2e_id text unique check (e2e_id is null or e2e_id ~ '^E[0-9]{20}[A-Z0-9]{11}$'),
  -- Confirmed by the engine (every rule matched), without the owner.
  add column auto_confirmed boolean not null default false;
