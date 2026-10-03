-- Prompt 2: core scheduling tables.
-- Every business table carries business_id. Child tables reference parents with composite
-- (id, business_id) foreign keys, so rows can never point to another business's data.

create extension if not exists btree_gist with schema extensions;

create schema if not exists private;
grant usage on schema private to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Reserved slugs
-- ---------------------------------------------------------------------------

create table public.reserved_slugs (
  slug text primary key
);

insert into public.reserved_slugs (slug) values
  ('admin'), ('agenda'), ('agendar'), ('ajuda'), ('api'), ('app'), ('auth'), ('avaliar'),
  ('blog'), ('brands'), ('cadastro'), ('cancelar'), ('conta'), ('contato'), ('descadastrar'),
  ('embed'), ('entrar'), ('explorar'), ('health'), ('login'), ('logout'), ('manifest'),
  ('novo'), ('painel'), ('pix'), ('planos'), ('precos'), ('privacidade'), ('recuperar-senha'),
  ('redefinir-senha'), ('remarcar'), ('robots'), ('sair'), ('signin'), ('signup'), ('sitemap'),
  ('sobre'), ('static'), ('suporte'), ('termos'), ('www');

/** 3–40 chars, lowercase letters, digits and inner hyphens; no accents. */
create function public.slug_format_is_valid(p_slug text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_slug ~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$' and p_slug !~ '--';
$$;

-- ---------------------------------------------------------------------------
-- Businesses
-- ---------------------------------------------------------------------------

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 120),
  slug text not null unique check (public.slug_format_is_valid(slug)),
  brand_key text not null,
  segment text not null check (
    segment in ('beauty', 'barber', 'aesthetics', 'psychology', 'physio', 'personal_trainer', 'tattoo')
  ),
  timezone text not null default 'America/Sao_Paulo',
  plan text not null default 'free' check (plan in ('free', 'pro', 'team')),
  trial_started_at timestamptz,
  trial_ends_at timestamptz,
  slot_interval_minutes integer not null default 30 check (slot_interval_minutes in (15, 30, 60)),
  min_notice_minutes integer not null default 120 check (min_notice_minutes between 0 and 43200),
  max_days_ahead integer not null default 60 check (max_days_ahead between 1 and 365),
  booking_confirmation text not null default 'auto' check (booking_confirmation in ('auto', 'manual')),
  no_show_limit integer check (no_show_limit is null or no_show_limit >= 1),
  portal_opt_out boolean not null default false,
  created_at timestamptz not null default now(),
  check ((trial_started_at is null) = (trial_ends_at is null)),
  check (trial_ends_at is null or trial_ends_at > trial_started_at)
);

create index businesses_brand_key_idx on public.businesses (brand_key);

create function private.check_reserved_slug()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (select 1 from public.reserved_slugs r where r.slug = new.slug) then
    raise exception 'slug "%" is reserved', new.slug using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger businesses_check_reserved_slug
before insert or update of slug on public.businesses
for each row execute function private.check_reserved_slug();

/** True when the slug has a valid format, is not reserved and is not taken. */
create function public.slug_is_available(p_slug text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.slug_format_is_valid(p_slug)
    and not exists (select 1 from public.reserved_slugs r where r.slug = p_slug)
    and not exists (select 1 from public.businesses b where b.slug = p_slug);
$$;

-- ---------------------------------------------------------------------------
-- Team
-- ---------------------------------------------------------------------------

create table public.professionals (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  photo_key text,
  active boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  unique (id, business_id)
);

create index professionals_business_id_idx on public.professionals (business_id);

create table public.members (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('owner', 'staff')),
  professional_id uuid,
  created_at timestamptz not null default now(),
  unique (business_id, user_id),
  foreign key (professional_id, business_id)
    references public.professionals (id, business_id) on delete set null (professional_id),
  check (role = 'owner' or professional_id is not null)
);

create index members_user_id_idx on public.members (user_id);
create index members_professional_id_idx on public.members (professional_id);

-- ---------------------------------------------------------------------------
-- Services and resources
-- ---------------------------------------------------------------------------

create table public.services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 100),
  description text check (description is null or char_length(description) <= 1000),
  duration_minutes integer not null check (duration_minutes between 5 and 720),
  buffer_minutes integer not null default 0 check (buffer_minutes between 0 and 240),
  price_cents integer not null default 0 check (price_cents >= 0),
  deposit_type text not null default 'none' check (deposit_type in ('none', 'fixed', 'percent')),
  deposit_value integer not null default 0 check (deposit_value >= 0),
  return_after_days integer check (return_after_days is null or return_after_days between 1 and 730),
  active boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  unique (id, business_id),
  check (
    (deposit_type = 'none' and deposit_value = 0)
    or (deposit_type = 'fixed' and deposit_value > 0)
    or (deposit_type = 'percent' and deposit_value between 1 and 100)
  )
);

create index services_business_id_idx on public.services (business_id);

create table public.professional_services (
  business_id uuid not null references public.businesses (id) on delete cascade,
  professional_id uuid not null,
  service_id uuid not null,
  duration_override integer check (duration_override is null or duration_override between 5 and 720),
  price_override integer check (price_override is null or price_override >= 0),
  primary key (professional_id, service_id),
  foreign key (professional_id, business_id)
    references public.professionals (id, business_id) on delete cascade,
  foreign key (service_id, business_id) references public.services (id, business_id) on delete cascade
);

create index professional_services_service_id_idx on public.professional_services (service_id);
create index professional_services_business_id_idx on public.professional_services (business_id);

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  created_at timestamptz not null default now(),
  unique (id, business_id)
);

create index resources_business_id_idx on public.resources (business_id);

create table public.service_resources (
  business_id uuid not null references public.businesses (id) on delete cascade,
  service_id uuid not null,
  resource_id uuid not null,
  primary key (service_id, resource_id),
  foreign key (service_id, business_id) references public.services (id, business_id) on delete cascade,
  foreign key (resource_id, business_id)
    references public.resources (id, business_id) on delete cascade
);

create index service_resources_resource_id_idx on public.service_resources (resource_id);
create index service_resources_business_id_idx on public.service_resources (business_id);

-- ---------------------------------------------------------------------------
-- Working hours and time off
-- ---------------------------------------------------------------------------

create table public.working_hours (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  professional_id uuid not null,
  weekday smallint not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  check (end_time > start_time),
  foreign key (professional_id, business_id)
    references public.professionals (id, business_id) on delete cascade
);

create index working_hours_professional_id_idx on public.working_hours (professional_id, weekday);
create index working_hours_business_id_idx on public.working_hours (business_id);

create table public.time_off (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  professional_id uuid not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text check (reason is null or char_length(reason) <= 200),
  created_at timestamptz not null default now(),
  check (ends_at > starts_at),
  foreign key (professional_id, business_id)
    references public.professionals (id, business_id) on delete cascade
);

create index time_off_professional_id_idx on public.time_off (professional_id, starts_at);
create index time_off_business_id_starts_at_idx on public.time_off (business_id, starts_at);

-- ---------------------------------------------------------------------------
-- Customers
-- ---------------------------------------------------------------------------

create function private.random_code(p_length integer)
returns text
language sql
volatile
set search_path = ''
as $$
  select substr(replace(gen_random_uuid()::text, '-', ''), 1, p_length);
$$;

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 120),
  email text check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  -- Digits only, with country code (e.g. 5511999998888).
  phone text check (phone is null or phone ~ '^[0-9]{10,15}$'),
  birthdate date,
  notes text check (notes is null or char_length(notes) <= 2000),
  marketing_opt_in boolean not null default false,
  blocked boolean not null default false,
  no_show_count integer not null default 0 check (no_show_count >= 0),
  referral_code text not null unique default private.random_code(10),
  referred_by_customer_id uuid,
  created_at timestamptz not null default now(),
  unique (id, business_id),
  foreign key (referred_by_customer_id, business_id)
    references public.customers (id, business_id) on delete set null (referred_by_customer_id),
  check (referred_by_customer_id is null or referred_by_customer_id <> id)
);

create unique index customers_business_phone_key on public.customers (business_id, phone)
  where phone is not null;
create index customers_business_id_idx on public.customers (business_id);
create index customers_referred_by_idx on public.customers (referred_by_customer_id);

-- ---------------------------------------------------------------------------
-- Appointments
-- ---------------------------------------------------------------------------

/** Statuses that hold a time slot. */
create function public.appointment_status_is_active(p_status text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_status in ('confirmed', 'pending', 'awaiting_deposit');
$$;

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  professional_id uuid not null,
  customer_id uuid not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null check (
    status in ('confirmed', 'pending', 'awaiting_deposit', 'cancelled', 'completed', 'no_show')
  ),
  source text not null check (source in ('chat', 'manual')),
  cancel_token text not null unique default private.random_code(32),
  deposit_cents integer not null default 0 check (deposit_cents >= 0),
  deposit_status text not null default 'none' check (
    deposit_status in ('none', 'waiting', 'informed', 'confirmed')
  ),
  deposit_expires_at timestamptz,
  coupon_code text,
  referral_code text,
  package_id uuid,
  google_event_id text,
  created_at timestamptz not null default now(),
  unique (id, business_id),
  check (ends_at > starts_at),
  foreign key (professional_id, business_id)
    references public.professionals (id, business_id) on delete cascade,
  foreign key (customer_id, business_id)
    references public.customers (id, business_id) on delete cascade,
  constraint appointments_no_overlap exclude using gist (
    professional_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  ) where (status in ('confirmed', 'pending', 'awaiting_deposit'))
);

create index appointments_business_starts_at_idx on public.appointments (business_id, starts_at);
create index appointments_professional_starts_at_idx on public.appointments (professional_id, starts_at);
create index appointments_customer_id_idx on public.appointments (customer_id);

create table public.appointment_services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  appointment_id uuid not null,
  service_id uuid,
  -- Copies at booking time, so later edits to the service do not change history.
  name text not null,
  duration_minutes integer not null check (duration_minutes > 0),
  price_cents integer not null check (price_cents >= 0),
  position integer not null default 0,
  foreign key (appointment_id, business_id)
    references public.appointments (id, business_id) on delete cascade,
  foreign key (service_id, business_id)
    references public.services (id, business_id) on delete set null (service_id)
);

create index appointment_services_appointment_id_idx on public.appointment_services (appointment_id);
create index appointment_services_service_id_idx on public.appointment_services (service_id);
create index appointment_services_business_id_idx on public.appointment_services (business_id);

create table public.appointment_resources (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  appointment_id uuid not null,
  resource_id uuid not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  -- Mirrors appointment_status_is_active(appointments.status); kept in sync by triggers.
  active boolean not null default true,
  check (ends_at > starts_at),
  foreign key (appointment_id, business_id)
    references public.appointments (id, business_id) on delete cascade,
  foreign key (resource_id, business_id)
    references public.resources (id, business_id) on delete cascade,
  constraint appointment_resources_no_overlap exclude using gist (
    resource_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  ) where (active)
);

create index appointment_resources_appointment_id_idx on public.appointment_resources (appointment_id);
create index appointment_resources_resource_id_idx on public.appointment_resources (resource_id, starts_at);
create index appointment_resources_business_id_idx on public.appointment_resources (business_id);

create function private.appointment_resources_set_active()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  select public.appointment_status_is_active(a.status) into new.active
  from public.appointments a
  where a.id = new.appointment_id;
  return new;
end;
$$;

create trigger appointment_resources_set_active
before insert on public.appointment_resources
for each row execute function private.appointment_resources_set_active();

create function private.appointments_sync_resources()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if public.appointment_status_is_active(new.status) is distinct from
     public.appointment_status_is_active(old.status) then
    update public.appointment_resources
    set active = public.appointment_status_is_active(new.status)
    where appointment_id = new.id;
  end if;
  return new;
end;
$$;

create trigger appointments_sync_resources
after update of status on public.appointments
for each row execute function private.appointments_sync_resources();

-- ---------------------------------------------------------------------------
-- Access helpers (security definer so policies do not recurse into members' RLS)
-- ---------------------------------------------------------------------------

create function private.is_member(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.members m
    where m.business_id = p_business_id and m.user_id = auth.uid()
  );
$$;

create function private.is_owner(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.members m
    where m.business_id = p_business_id and m.user_id = auth.uid() and m.role = 'owner'
  );
$$;

/** Owner of the business, or staff linked to this professional. */
create function private.can_access_professional(p_business_id uuid, p_professional_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.members m
    where m.business_id = p_business_id
      and m.user_id = auth.uid()
      and (m.role = 'owner' or m.professional_id = p_professional_id)
  );
$$;

create function private.can_access_appointment(p_appointment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.appointments a
    where a.id = p_appointment_id
      and private.can_access_professional(a.business_id, a.professional_id)
  );
$$;

/** Owner, or staff whose professional has (had) an appointment with this customer. */
create function private.can_access_customer(p_business_id uuid, p_customer_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_owner(p_business_id) or exists (
    select 1
    from public.members m
    join public.appointments a
      on a.business_id = m.business_id and a.professional_id = m.professional_id
    where m.business_id = p_business_id
      and m.user_id = auth.uid()
      and m.role = 'staff'
      and a.customer_id = p_customer_id
  );
$$;

grant execute on all functions in schema private to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.reserved_slugs enable row level security;
alter table public.businesses enable row level security;
alter table public.professionals enable row level security;
alter table public.members enable row level security;
alter table public.services enable row level security;
alter table public.professional_services enable row level security;
alter table public.resources enable row level security;
alter table public.service_resources enable row level security;
alter table public.working_hours enable row level security;
alter table public.time_off enable row level security;
alter table public.customers enable row level security;
alter table public.appointments enable row level security;
alter table public.appointment_services enable row level security;
alter table public.appointment_resources enable row level security;

create policy "reserved slugs are public" on public.reserved_slugs
  for select to anon, authenticated using (true);

-- Businesses are created and deleted by the server (service role) only.
create policy "members read their business" on public.businesses
  for select to authenticated using (private.is_member(id));
create policy "owner updates business" on public.businesses
  for update to authenticated using (private.is_owner(id)) with check (private.is_owner(id));

create policy "members read team" on public.members
  for select to authenticated using (private.is_member(business_id));
create policy "owner manages team" on public.members
  for all to authenticated
  using (private.is_owner(business_id)) with check (private.is_owner(business_id));

create policy "members read professionals" on public.professionals
  for select to authenticated using (private.is_member(business_id));
create policy "owner manages professionals" on public.professionals
  for all to authenticated
  using (private.is_owner(business_id)) with check (private.is_owner(business_id));

create policy "members read services" on public.services
  for select to authenticated using (private.is_member(business_id));
create policy "owner manages services" on public.services
  for all to authenticated
  using (private.is_owner(business_id)) with check (private.is_owner(business_id));

create policy "members read professional services" on public.professional_services
  for select to authenticated using (private.is_member(business_id));
create policy "owner manages professional services" on public.professional_services
  for all to authenticated
  using (private.is_owner(business_id)) with check (private.is_owner(business_id));

create policy "members read resources" on public.resources
  for select to authenticated using (private.is_member(business_id));
create policy "owner manages resources" on public.resources
  for all to authenticated
  using (private.is_owner(business_id)) with check (private.is_owner(business_id));

create policy "members read service resources" on public.service_resources
  for select to authenticated using (private.is_member(business_id));
create policy "owner manages service resources" on public.service_resources
  for all to authenticated
  using (private.is_owner(business_id)) with check (private.is_owner(business_id));

create policy "owner and own staff read working hours" on public.working_hours
  for select to authenticated using (private.can_access_professional(business_id, professional_id));
create policy "owner manages working hours" on public.working_hours
  for all to authenticated
  using (private.is_owner(business_id)) with check (private.is_owner(business_id));

create policy "owner and own staff manage time off" on public.time_off
  for all to authenticated
  using (private.can_access_professional(business_id, professional_id))
  with check (private.can_access_professional(business_id, professional_id));

create policy "owner and related staff read customers" on public.customers
  for select to authenticated using (private.can_access_customer(business_id, id));
create policy "members create customers" on public.customers
  for insert to authenticated with check (private.is_member(business_id));
create policy "owner and related staff update customers" on public.customers
  for update to authenticated
  using (private.can_access_customer(business_id, id))
  with check (private.can_access_customer(business_id, id));
create policy "owner deletes customers" on public.customers
  for delete to authenticated using (private.is_owner(business_id));

create policy "owner and own staff manage appointments" on public.appointments
  for all to authenticated
  using (private.can_access_professional(business_id, professional_id))
  with check (private.can_access_professional(business_id, professional_id));

create policy "appointment services follow appointment" on public.appointment_services
  for all to authenticated
  using (private.can_access_appointment(appointment_id))
  with check (private.can_access_appointment(appointment_id));

create policy "appointment resources follow appointment" on public.appointment_resources
  for all to authenticated
  using (private.can_access_appointment(appointment_id))
  with check (private.can_access_appointment(appointment_id));

-- ---------------------------------------------------------------------------
-- Public read functions (the only way anon reads business data)
-- ---------------------------------------------------------------------------

create function public.get_public_business(p_slug text)
returns table (
  id uuid,
  name text,
  slug text,
  brand_key text,
  segment text,
  timezone text,
  plan text,
  trial_ends_at timestamptz,
  slot_interval_minutes integer,
  min_notice_minutes integer,
  max_days_ahead integer,
  booking_confirmation text
)
language sql
stable
security definer
set search_path = ''
as $$
  select b.id, b.name, b.slug, b.brand_key, b.segment, b.timezone, b.plan, b.trial_ends_at,
         b.slot_interval_minutes, b.min_notice_minutes, b.max_days_ahead, b.booking_confirmation
  from public.businesses b
  where b.slug = lower(p_slug);
$$;

create function public.get_public_services(p_business_id uuid)
returns table (
  id uuid,
  name text,
  description text,
  duration_minutes integer,
  buffer_minutes integer,
  price_cents integer,
  deposit_type text,
  deposit_value integer,
  "position" integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select s.id, s.name, s.description, s.duration_minutes, s.buffer_minutes, s.price_cents,
         s.deposit_type, s.deposit_value, s.position
  from public.services s
  where s.business_id = p_business_id and s.active
  order by s.position, s.name;
$$;

create function public.get_public_professionals(p_business_id uuid)
returns table (id uuid, name text, photo_key text, "position" integer)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.name, p.photo_key, p.position
  from public.professionals p
  where p.business_id = p_business_id and p.active
  order by p.position, p.name;
$$;

revoke execute on function public.get_public_business(text) from public;
revoke execute on function public.get_public_services(uuid) from public;
revoke execute on function public.get_public_professionals(uuid) from public;
revoke execute on function public.slug_is_available(text) from public;
grant execute on function public.get_public_business(text) to anon, authenticated, service_role;
grant execute on function public.get_public_services(uuid) to anon, authenticated, service_role;
grant execute on function public.get_public_professionals(uuid) to anon, authenticated, service_role;
grant execute on function public.slug_is_available(text) to anon, authenticated, service_role;
