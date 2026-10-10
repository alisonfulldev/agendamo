-- Deposit / full payment by Pix with a mandatory receipt (Pro plan, 2026-10-11). The customer pays
-- straight to the professional's Pix key (MeetChat never handles the money), sends the receipt in
-- the chat, and the professional checks it in the bank and confirms by hand. No reading of the
-- receipt's content in this version (fields for a future reader are kept empty).

-- ---------------------------------------------------------------------------
-- Settings (page_settings already has pix_key and pix_receiver_name)
-- ---------------------------------------------------------------------------
alter table public.page_settings
  add column pix_city text check (pix_city is null or char_length(pix_city) between 1 and 15),
  add column deposit_min_cents integer not null default 0
    check (deposit_min_cents between 0 and 1000000),
  add column deposit_hold_minutes integer not null default 20
    check (deposit_hold_minutes between 5 and 120),
  add column deposit_policy_text text
    check (deposit_policy_text is null or char_length(deposit_policy_text) <= 2000),
  add column deposit_policy_version integer not null default 1 check (deposit_policy_version >= 1),
  add column deposit_reminder_hours integer[] not null default '{2,6}';

-- ---------------------------------------------------------------------------
-- Services: also "full" (the whole price, paid when booking)
-- ---------------------------------------------------------------------------
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.services'::regclass and contype = 'c'
      and pg_get_constraintdef(oid) like '%deposit_type%'
  loop
    execute format('alter table public.services drop constraint %I', c.conname);
  end loop;
end $$;
alter table public.services
  add constraint services_deposit_type_check check (deposit_type in ('none', 'fixed', 'percent', 'full')),
  add constraint services_deposit_rule_check check (
    (deposit_type in ('none', 'full') and deposit_value = 0)
    or (deposit_type = 'fixed' and deposit_value > 0)
    or (deposit_type = 'percent' and deposit_value between 1 and 100)
  );

-- ---------------------------------------------------------------------------
-- Appointments: payment status and its history
-- waiting (aguardando pagamento) → sent (comprovante enviado, pré-confirmado) → confirmed |
-- refused | expired; refunded (devolvido, recorded by the professional).
-- ---------------------------------------------------------------------------
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.appointments'::regclass and contype = 'c'
      and pg_get_constraintdef(oid) like '%deposit_status%'
  loop
    execute format('alter table public.appointments drop constraint %I', c.conname);
  end loop;
end $$;
update public.appointments set deposit_status = 'sent' where deposit_status = 'informed';
alter table public.appointments
  add constraint appointments_deposit_status_check check (
    deposit_status in ('none', 'waiting', 'sent', 'confirmed', 'refused', 'expired', 'refunded')
  ),
  add column deposit_reference text check (deposit_reference is null or deposit_reference ~ '^[A-Za-z0-9]{1,25}$'),
  add column deposit_sent_at timestamptz,
  add column deposit_decided_at timestamptz,
  add column deposit_refused_reason text
    check (deposit_refused_reason is null or char_length(deposit_refused_reason) <= 300),
  add column deposit_refunded_at date,
  add column deposit_refunded_cents integer check (deposit_refunded_cents is null or deposit_refunded_cents > 0);

-- Unique cents: never the same amount for two pending payments of the same professional, so the
-- professional can tell them apart in the bank statement.
create unique index appointments_pending_deposit_amount_idx
  on public.appointments (professional_id, deposit_cents)
  where deposit_status in ('waiting', 'sent') and deposit_cents > 0;

-- ---------------------------------------------------------------------------
-- Receipts: the file lives in R2 under receipts/<random 128-bit id>.<ext> (nothing predictable,
-- no business or appointment id); the link to the appointment exists only here. The hash stays
-- after the file is deleted (30 days after the decision), so the same file is still refused.
-- ---------------------------------------------------------------------------
create table public.deposit_receipts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  appointment_id uuid not null,
  object_key text check (object_key is null or object_key ~ '^receipts/[0-9a-f]{32,}\.(jpg|png|webp|pdf)$'),
  content_type text check (content_type in ('image/jpeg', 'image/png', 'image/webp', 'application/pdf')),
  size_bytes integer check (size_bytes is null or size_bytes between 1 and 5242880),
  sha256 text unique check (sha256 is null or sha256 ~ '^[0-9a-f]{64}$'),
  -- uploading: URL signed, file not checked yet; received: valid file (appointment pre-confirmed);
  -- accepted / rejected: the professional's decision; duplicate: same file as another appointment.
  status text not null default 'uploading'
    check (status in ('uploading', 'received', 'accepted', 'rejected', 'duplicate', 'invalid')),
  created_at timestamptz not null default now(),
  uploaded_at timestamptz,
  decided_at timestamptz,
  deleted_at timestamptz,
  -- Prepared for a future reading engine (not implemented: nothing is read in this version).
  extraction_status text not null default 'not_requested'
    check (extraction_status in ('not_requested', 'pending', 'done', 'failed')),
  extracted jsonb,
  foreign key (appointment_id, business_id)
    references public.appointments (id, business_id) on delete cascade
);
create index deposit_receipts_appointment_idx on public.deposit_receipts (appointment_id);
create index deposit_receipts_cleanup_idx on public.deposit_receipts (decided_at)
  where object_key is not null;
alter table public.deposit_receipts enable row level security;
create policy deposit_receipts_owner_select on public.deposit_receipts
  for select using (private.is_owner(business_id));

-- The cancellation and refund policy the customer accepted before paying (text, version, date).
create table public.deposit_policy_acceptances (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  appointment_id uuid not null,
  policy_text text not null check (char_length(policy_text) between 1 and 2000),
  policy_version integer not null check (policy_version >= 1),
  accepted_at timestamptz not null default now(),
  foreign key (appointment_id, business_id)
    references public.appointments (id, business_id) on delete cascade
);
create index deposit_policy_acceptances_appointment_idx
  on public.deposit_policy_acceptances (appointment_id);
alter table public.deposit_policy_acceptances enable row level security;
create policy deposit_policy_acceptances_owner_select on public.deposit_policy_acceptances
  for select using (private.is_owner(business_id));
