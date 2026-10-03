-- Prompt 3: page, sales, portal, notifications, billing and support tables.

-- ---------------------------------------------------------------------------
-- Page
-- ---------------------------------------------------------------------------

create table public.page_settings (
  business_id uuid primary key references public.businesses (id) on delete cascade,
  bio text check (bio is null or char_length(bio) <= 500),
  avatar_key text,
  cover_key text,
  primary_color_override text check (primary_color_override is null or primary_color_override ~ '^#[0-9a-fA-F]{6}$'),
  whatsapp_number text check (whatsapp_number is null or whatsapp_number ~ '^[0-9]{10,15}$'),
  instagram_url text check (instagram_url is null or instagram_url ~ '^https://'),
  address text check (address is null or char_length(address) <= 200),
  city text check (city is null or char_length(city) <= 80),
  neighborhood text check (neighborhood is null or char_length(neighborhood) <= 80),
  show_prices boolean not null default true,
  google_review_url text check (google_review_url is null or google_review_url ~ '^https://'),
  pix_key text check (pix_key is null or char_length(pix_key) <= 77),
  pix_receiver_name text check (pix_receiver_name is null or char_length(pix_receiver_name) <= 25),
  deposit_deadline_minutes integer not null default 60 check (deposit_deadline_minutes between 5 and 2880),
  updated_at timestamptz not null default now()
);

create table public.page_links (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  label text not null check (char_length(trim(label)) between 1 and 60),
  url text not null check (url ~ '^https?://' and char_length(url) <= 500),
  position integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index page_links_business_id_idx on public.page_links (business_id, position);

create table public.page_photos (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  object_key text not null unique,
  width integer not null check (width > 0),
  height integer not null check (height > 0),
  size_bytes integer not null check (size_bytes > 0),
  position integer not null default 0,
  -- Hidden when the plan limit drops (e.g. trial ended); never deleted automatically.
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);

create index page_photos_business_id_idx on public.page_photos (business_id, position);

-- ---------------------------------------------------------------------------
-- Visitor-submitted data (inserted by the server only)
-- ---------------------------------------------------------------------------

create table public.booking_requests (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  service_id uuid,
  customer_name text not null check (char_length(trim(customer_name)) between 1 and 120),
  phone text not null check (phone ~ '^[0-9]{10,15}$'),
  email text check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  preferred_date date,
  preferred_period text check (preferred_period is null or preferred_period in ('morning', 'afternoon', 'evening')),
  message text check (message is null or char_length(message) <= 1000),
  status text not null default 'new' check (status in ('new', 'contacted', 'done', 'discarded')),
  created_at timestamptz not null default now(),
  foreign key (service_id, business_id) references public.services (id, business_id) on delete set null (service_id)
);

create index booking_requests_business_id_idx on public.booking_requests (business_id, created_at desc);

create table public.abandoned_bookings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  service_ids uuid[] not null default '{}',
  date date,
  slot timestamptz,
  customer_name text check (customer_name is null or char_length(customer_name) <= 120),
  phone text check (phone is null or phone ~ '^[0-9]{10,15}$'),
  email text check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  -- Only rows with consent are ever stored (enforced here too).
  consent boolean not null check (consent),
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now()
);

create index abandoned_bookings_business_id_idx on public.abandoned_bookings (business_id, created_at desc);

create table public.waitlist_entries (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  service_id uuid not null,
  professional_id uuid,
  date date not null,
  customer_name text not null check (char_length(trim(customer_name)) between 1 and 120),
  phone text not null check (phone ~ '^[0-9]{10,15}$'),
  email text check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  notified_at timestamptz,
  status text not null default 'waiting' check (status in ('waiting', 'notified', 'booked', 'expired', 'removed')),
  created_at timestamptz not null default now(),
  foreign key (service_id, business_id) references public.services (id, business_id) on delete cascade,
  foreign key (professional_id, business_id)
    references public.professionals (id, business_id) on delete set null (professional_id)
);

create index waitlist_entries_lookup_idx on public.waitlist_entries (business_id, date, service_id, created_at);

-- ---------------------------------------------------------------------------
-- Reviews and referrals
-- ---------------------------------------------------------------------------

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  appointment_id uuid not null unique,
  customer_id uuid,
  rating smallint not null check (rating between 1 and 5),
  comment text check (comment is null or char_length(comment) <= 1000),
  reply text check (reply is null or char_length(reply) <= 1000),
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  foreign key (appointment_id, business_id) references public.appointments (id, business_id) on delete cascade,
  foreign key (customer_id, business_id) references public.customers (id, business_id) on delete set null (customer_id)
);

create index reviews_business_id_idx on public.reviews (business_id, created_at desc);

create table public.review_tokens (
  token text primary key default private.random_code(32),
  business_id uuid not null references public.businesses (id) on delete cascade,
  appointment_id uuid not null unique,
  expires_at timestamptz not null default now() + interval '30 days',
  used_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (appointment_id, business_id) references public.appointments (id, business_id) on delete cascade
);

create index review_tokens_business_id_idx on public.review_tokens (business_id);

create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  referrer_customer_id uuid not null,
  -- A customer can only be referred once.
  referred_customer_id uuid not null unique,
  appointment_id uuid,
  status text not null default 'pending' check (status in ('pending', 'valid')),
  reward_applied boolean not null default false,
  created_at timestamptz not null default now(),
  check (referrer_customer_id <> referred_customer_id),
  foreign key (referrer_customer_id, business_id) references public.customers (id, business_id) on delete cascade,
  foreign key (referred_customer_id, business_id) references public.customers (id, business_id) on delete cascade,
  foreign key (appointment_id, business_id)
    references public.appointments (id, business_id) on delete set null (appointment_id)
);

create index referrals_business_id_idx on public.referrals (business_id, created_at desc);
create index referrals_referrer_idx on public.referrals (referrer_customer_id);

-- ---------------------------------------------------------------------------
-- Packages, combos and business coupons
-- ---------------------------------------------------------------------------

create table public.packages (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  service_id uuid not null,
  name text not null check (char_length(trim(name)) between 1 and 100),
  sessions integer not null check (sessions between 2 and 100),
  price_cents integer not null check (price_cents >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (id, business_id),
  foreign key (service_id, business_id) references public.services (id, business_id) on delete cascade
);

create index packages_business_id_idx on public.packages (business_id);

create table public.customer_packages (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  customer_id uuid not null,
  package_id uuid not null,
  sessions_left integer not null check (sessions_left >= 0),
  sold_at timestamptz not null default now(),
  unique (id, business_id),
  foreign key (customer_id, business_id) references public.customers (id, business_id) on delete cascade,
  foreign key (package_id, business_id) references public.packages (id, business_id) on delete restrict
);

create index customer_packages_customer_id_idx on public.customer_packages (customer_id);
create index customer_packages_package_id_idx on public.customer_packages (package_id);

alter table public.appointments
  add constraint appointments_package_fk foreign key (package_id, business_id)
  references public.customer_packages (id, business_id) on delete set null (package_id);
create index appointments_package_id_idx on public.appointments (package_id);

create table public.combos (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 100),
  price_cents integer not null check (price_cents >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (id, business_id)
);

create index combos_business_id_idx on public.combos (business_id);

create table public.combo_services (
  business_id uuid not null references public.businesses (id) on delete cascade,
  combo_id uuid not null,
  service_id uuid not null,
  position integer not null default 0,
  primary key (combo_id, service_id),
  foreign key (combo_id, business_id) references public.combos (id, business_id) on delete cascade,
  foreign key (service_id, business_id) references public.services (id, business_id) on delete cascade
);

create index combo_services_service_id_idx on public.combo_services (service_id);

create table public.business_coupons (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  code text not null check (code ~ '^[A-Z0-9_-]{3,30}$'),
  discount_type text not null check (discount_type in ('percent', 'fixed')),
  discount_value integer not null check (discount_value > 0),
  valid_until timestamptz,
  max_uses integer check (max_uses is null or max_uses > 0),
  uses integer not null default 0 check (uses >= 0),
  created_at timestamptz not null default now(),
  unique (business_id, code),
  check (discount_type = 'fixed' or discount_value <= 100),
  check (max_uses is null or uses <= max_uses)
);

-- ---------------------------------------------------------------------------
-- Page analytics (no personal data: anonymous session id only)
-- ---------------------------------------------------------------------------

create table public.page_events (
  id bigint generated always as identity primary key,
  business_id uuid not null references public.businesses (id) on delete cascade,
  type text not null check (type in (
    'view', 'click_whatsapp', 'click_instagram', 'click_link', 'click_book',
    'request_started', 'request_sent', 'booking_started', 'booking_confirmed'
  )),
  session_id uuid not null,
  occurred_at timestamptz not null default now(),
  outside_hours boolean not null default false,
  meta jsonb not null default '{}'::jsonb check (pg_column_size(meta) <= 2048)
);

create index page_events_business_occurred_idx on public.page_events (business_id, occurred_at);
create index page_events_occurred_idx on public.page_events (occurred_at);

create table public.page_stats_daily (
  business_id uuid not null references public.businesses (id) on delete cascade,
  date date not null,
  -- { "view": 10, "click_book": 3, ... }
  counts jsonb not null default '{}'::jsonb,
  -- Same keys, only events outside working hours.
  outside_hours jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (business_id, date)
);

create table public.portal_events (
  id bigint generated always as identity primary key,
  brand_key text not null,
  city text,
  neighborhood text,
  service_slug text,
  business_id uuid references public.businesses (id) on delete cascade,
  type text not null check (type in ('search', 'view', 'click')),
  session_id uuid not null,
  occurred_at timestamptz not null default now()
);

create index portal_events_occurred_idx on public.portal_events (occurred_at);
create index portal_events_business_idx on public.portal_events (business_id, occurred_at);

create table public.portal_stats_monthly (
  brand_key text not null,
  city text not null default '',
  neighborhood text not null default '',
  service_slug text not null default '',
  month date not null check (extract(day from month) = 1),
  searches integer not null default 0,
  views integer not null default 0,
  clicks integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (brand_key, city, neighborhood, service_slug, month)
);

create table public.portal_featured (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  city text not null,
  active_until timestamptz not null,
  created_at timestamptz not null default now(),
  unique (business_id, city)
);

create index portal_featured_city_idx on public.portal_featured (city, active_until);

-- ---------------------------------------------------------------------------
-- Integrations
-- ---------------------------------------------------------------------------

create table public.custom_domains (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null unique references public.businesses (id) on delete cascade,
  domain text not null unique check (domain ~ '^[a-z0-9-]+(\.[a-z0-9-]+)+$'),
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.calendar_connections (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  professional_id uuid not null,
  provider text not null default 'google' check (provider in ('google')),
  -- AES-256-GCM ciphertext (see src/lib/crypto.ts). Never read by clients.
  access_token_encrypted text not null,
  refresh_token_encrypted text not null,
  token_expires_at timestamptz,
  calendar_id text not null default 'primary',
  created_at timestamptz not null default now(),
  unique (professional_id, provider),
  foreign key (professional_id, business_id) references public.professionals (id, business_id) on delete cascade
);

create index calendar_connections_business_id_idx on public.calendar_connections (business_id);

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index push_subscriptions_user_id_idx on public.push_subscriptions (user_id);

create table public.notification_preferences (
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null,
  email boolean not null default true,
  push boolean not null default true,
  primary key (user_id, type)
);

create table public.notification_log (
  id bigint generated always as identity primary key,
  business_id uuid not null references public.businesses (id) on delete cascade,
  type text not null,
  reference text not null,
  sent_at timestamptz not null default now(),
  unique (business_id, type, reference)
);

create table public.email_unsubscribes (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  business_id uuid not null references public.businesses (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (email, business_id)
);

-- ---------------------------------------------------------------------------
-- Billing
-- ---------------------------------------------------------------------------

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null unique references public.businesses (id) on delete cascade,
  provider text not null default 'asaas' check (provider in ('asaas')),
  provider_customer_id text,
  provider_subscription_id text unique,
  plan text not null check (plan in ('pro', 'team')),
  billing_cycle text not null check (billing_cycle in ('monthly', 'yearly')),
  -- { "featured_cities": ["Campinas"], "custom_domain": true }
  addons jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'active', 'overdue', 'cancelled')),
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.platform_coupons (
  code text primary key check (code ~ '^[A-Z0-9_-]{3,30}$'),
  discount_percent integer not null check (discount_percent between 1 and 100),
  valid_until timestamptz,
  max_uses integer check (max_uses is null or max_uses > 0),
  uses integer not null default 0 check (uses >= 0),
  brand_key text,
  created_at timestamptz not null default now(),
  check (max_uses is null or uses <= max_uses)
);

-- ---------------------------------------------------------------------------
-- Audit
-- ---------------------------------------------------------------------------

create table public.audit_log (
  id bigint generated always as identity primary key,
  -- Null for platform-level actions (admin coupons etc.).
  business_id uuid references public.businesses (id) on delete set null,
  user_id uuid,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_log_business_id_idx on public.audit_log (business_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Plan limits
-- ---------------------------------------------------------------------------

create function public.photo_limit(p_plan text)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case p_plan when 'team' then 60 when 'pro' then 30 else 9 end;
$$;

create function public.professional_limit(p_plan text)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case p_plan when 'team' then 5 else 1 end;
$$;

-- ---------------------------------------------------------------------------
-- Row level security
-- Visitor data (events, requests, abandoned bookings, waitlist) has no insert policy:
-- only the server (service role) writes it. Server-only tables have RLS and no policies.
-- ---------------------------------------------------------------------------

alter table public.page_settings enable row level security;
alter table public.page_links enable row level security;
alter table public.page_photos enable row level security;
alter table public.booking_requests enable row level security;
alter table public.abandoned_bookings enable row level security;
alter table public.waitlist_entries enable row level security;
alter table public.reviews enable row level security;
alter table public.review_tokens enable row level security;
alter table public.referrals enable row level security;
alter table public.packages enable row level security;
alter table public.customer_packages enable row level security;
alter table public.combos enable row level security;
alter table public.combo_services enable row level security;
alter table public.business_coupons enable row level security;
alter table public.page_events enable row level security;
alter table public.page_stats_daily enable row level security;
alter table public.portal_events enable row level security;
alter table public.portal_stats_monthly enable row level security;
alter table public.portal_featured enable row level security;
alter table public.custom_domains enable row level security;
alter table public.calendar_connections enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.notification_log enable row level security;
alter table public.email_unsubscribes enable row level security;
alter table public.subscriptions enable row level security;
alter table public.platform_coupons enable row level security;
alter table public.audit_log enable row level security;

-- Page content: members read, owner manages.
create policy "members read page settings" on public.page_settings
  for select to authenticated using (private.is_member(business_id));
create policy "owner manages page settings" on public.page_settings
  for all to authenticated using (private.is_owner(business_id)) with check (private.is_owner(business_id));

create policy "members read page links" on public.page_links
  for select to authenticated using (private.is_member(business_id));
create policy "owner manages page links" on public.page_links
  for all to authenticated using (private.is_owner(business_id)) with check (private.is_owner(business_id));

create policy "members read page photos" on public.page_photos
  for select to authenticated using (private.is_member(business_id));
create policy "owner updates page photos" on public.page_photos
  for update to authenticated using (private.is_owner(business_id)) with check (private.is_owner(business_id));

-- Visitor data: owner reads and updates status; inserts only by the server.
create policy "owner reads booking requests" on public.booking_requests
  for select to authenticated using (private.is_owner(business_id));
create policy "owner updates booking requests" on public.booking_requests
  for update to authenticated using (private.is_owner(business_id)) with check (private.is_owner(business_id));

create policy "owner reads abandoned bookings" on public.abandoned_bookings
  for select to authenticated using (private.is_owner(business_id));
create policy "owner updates abandoned bookings" on public.abandoned_bookings
  for update to authenticated using (private.is_owner(business_id)) with check (private.is_owner(business_id));

create policy "owner reads waitlist" on public.waitlist_entries
  for select to authenticated using (private.is_owner(business_id));
create policy "owner updates waitlist" on public.waitlist_entries
  for update to authenticated using (private.is_owner(business_id)) with check (private.is_owner(business_id));

create policy "owner reads page events" on public.page_events
  for select to authenticated using (private.is_owner(business_id));
create policy "owner reads page stats" on public.page_stats_daily
  for select to authenticated using (private.is_owner(business_id));

-- Reviews: owner reads, replies and hides.
create policy "owner reads reviews" on public.reviews
  for select to authenticated using (private.is_owner(business_id));
create policy "owner updates reviews" on public.reviews
  for update to authenticated using (private.is_owner(business_id)) with check (private.is_owner(business_id));

create policy "owner manages referrals" on public.referrals
  for all to authenticated using (private.is_owner(business_id)) with check (private.is_owner(business_id));

-- Sales catalog: members read (staff books with combos/packages), owner manages.
create policy "members read packages" on public.packages
  for select to authenticated using (private.is_member(business_id));
create policy "owner manages packages" on public.packages
  for all to authenticated using (private.is_owner(business_id)) with check (private.is_owner(business_id));

create policy "owner and related staff read customer packages" on public.customer_packages
  for select to authenticated using (private.can_access_customer(business_id, customer_id));
create policy "owner manages customer packages" on public.customer_packages
  for all to authenticated using (private.is_owner(business_id)) with check (private.is_owner(business_id));

create policy "members read combos" on public.combos
  for select to authenticated using (private.is_member(business_id));
create policy "owner manages combos" on public.combos
  for all to authenticated using (private.is_owner(business_id)) with check (private.is_owner(business_id));

create policy "members read combo services" on public.combo_services
  for select to authenticated using (private.is_member(business_id));
create policy "owner manages combo services" on public.combo_services
  for all to authenticated using (private.is_owner(business_id)) with check (private.is_owner(business_id));

create policy "owner manages business coupons" on public.business_coupons
  for all to authenticated using (private.is_owner(business_id)) with check (private.is_owner(business_id));

create policy "owner reads featured" on public.portal_featured
  for select to authenticated using (private.is_owner(business_id));

create policy "owner reads custom domain" on public.custom_domains
  for select to authenticated using (private.is_owner(business_id));

create policy "own push subscriptions" on public.push_subscriptions
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own notification preferences" on public.notification_preferences
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "owner reads subscription" on public.subscriptions
  for select to authenticated using (private.is_owner(business_id));

create policy "owner reads audit log" on public.audit_log
  for select to authenticated using (business_id is not null and private.is_owner(business_id));

-- Server-only (no policies): review_tokens, portal_events, portal_stats_monthly,
-- calendar_connections, notification_log, email_unsubscribes, platform_coupons.
