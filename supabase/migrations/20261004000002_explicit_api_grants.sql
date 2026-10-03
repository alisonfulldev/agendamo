-- New Supabase projects may not expose new tables to the Data API by default. The app relies on
-- RLS (enabled on every public table, see supabase/tests/security.test.ts), so the API roles get
-- explicit table and sequence privileges here; functions keep their own grants/revokes.

grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to anon, authenticated, service_role;
grant usage, select on all sequences in schema public to anon, authenticated, service_role;

alter default privileges in schema public
  grant select, insert, update, delete on tables to anon, authenticated, service_role;
alter default privileges in schema public
  grant usage, select on sequences to anon, authenticated, service_role;
