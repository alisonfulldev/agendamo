-- Headline/CTA experiments (docs/design/experiments.md): which variant the page showed, as
-- "experiment:variant" (e.g. "home-hero:b"). Anonymous like the rest of the table.
alter table public.site_events
  add column experiment text
  check (experiment is null or experiment ~ '^[a-z0-9-]{1,60}:[a-z0-9]{1,8}$');

create index site_events_experiment_idx on public.site_events (experiment, type, created_at)
  where experiment is not null;
