-- Prompts 30–33: per-business marketing settings and message templates.

create table public.marketing_settings (
  business_id uuid primary key references public.businesses (id) on delete cascade,
  -- "Clientes que sumiram": no visit for this many days.
  inactive_days integer not null default 60 check (inactive_days between 15 and 730),
  -- "Hora de voltar" e-mail (only to customers with opt-in, rule 10).
  return_email_enabled boolean not null default true,
  -- Birthday e-mail (opt-in only), optionally with a business coupon.
  birthday_email_enabled boolean not null default false,
  birthday_coupon_code text,
  -- Referral reward shown to customers and in the owner's list.
  referral_reward_text text check (referral_reward_text is null or char_length(referral_reward_text) <= 200),
  -- Empty slots alert: notify when tomorrow has at least this many free slots.
  empty_slots_threshold integer not null default 4 check (empty_slots_threshold between 1 and 50),
  -- WhatsApp templates (owner edits; brand suggestions are the default). Keys: reactivation, return, birthday, abandoned.
  templates jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.marketing_settings enable row level security;

create policy "owner manages marketing settings" on public.marketing_settings
  for all to authenticated using (private.is_owner(business_id)) with check (private.is_owner(business_id));

/** Cleanup (Prompt 31 and housekeeping): abandoned bookings older than 30 days, expired review tokens. */
create function public.purge_expired()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_abandoned integer;
  v_tokens integer;
begin
  delete from public.abandoned_bookings where created_at < now() - interval '30 days';
  get diagnostics v_abandoned = row_count;
  delete from public.review_tokens where used_at is null and expires_at < now() - interval '30 days';
  get diagnostics v_tokens = row_count;
  return jsonb_build_object('abandoned', v_abandoned, 'review_tokens', v_tokens);
end;
$$;

revoke execute on function public.purge_expired() from public, anon, authenticated;
grant execute on function public.purge_expired() to service_role;
