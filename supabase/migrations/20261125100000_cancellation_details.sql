-- Who cancelled an appointment, when and why (to check complaints later).
-- Old cancellations stay null: they are not rewritten.
alter table public.appointments
  add column cancelled_at timestamptz,
  add column cancelled_by text check (cancelled_by in ('customer', 'business', 'system')),
  add column cancel_reason text check (cancel_reason is null or char_length(cancel_reason) <= 500);
