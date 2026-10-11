-- Deposit by Pix with the exact amount set by the owner (2026-10-13): no more unique cents, so two
-- pending payments of the same professional may have the same amount (told apart by the payer's
-- name and time in the bank statement).
drop index if exists public.appointments_pending_deposit_amount_idx;
