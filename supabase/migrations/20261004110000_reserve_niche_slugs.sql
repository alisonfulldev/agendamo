-- Agendamo site pages (/beleza, /barbearia…, /comecar) are app routes: a business page there
-- would be unreachable. Future niches reserved too.
insert into public.reserved_slugs (slug) values
  ('beleza'), ('barbearia'), ('estetica'), ('psicologia'), ('fisioterapia'),
  ('personal'), ('tatuagem'), ('comecar'), ('perfil')
on conflict do nothing;
