-- Last time the owner opened the panel (2026-10-28), shown in the admin list of businesses.
-- Updated at most once an hour, on the server, from the business context of the panel.
alter table public.businesses add column owner_last_seen_at timestamptz;
