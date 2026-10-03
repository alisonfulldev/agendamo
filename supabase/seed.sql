-- Development seed: one business per brand, 2 professionals, 1 resource, 3 services,
-- working hours Tuesday to Saturday with a lunch break. Safe to run more than once.

insert into public.businesses (id, name, slug, brand_key, segment) values
  ('b0000000-0000-4000-8000-000000000001', 'Studio Bela', 'studio-bela', 'beauty', 'beauty'),
  ('b0000000-0000-4000-8000-000000000002', 'Barbearia Navalha', 'barbearia-navalha', 'barber', 'barber')
on conflict (id) do nothing;

insert into public.professionals (id, business_id, name, position) values
  ('c0000000-0000-4000-8000-000000000011', 'b0000000-0000-4000-8000-000000000001', 'Ana', 0),
  ('c0000000-0000-4000-8000-000000000012', 'b0000000-0000-4000-8000-000000000001', 'Bruna', 1),
  ('c0000000-0000-4000-8000-000000000021', 'b0000000-0000-4000-8000-000000000002', 'Carlos', 0),
  ('c0000000-0000-4000-8000-000000000022', 'b0000000-0000-4000-8000-000000000002', 'Diego', 1)
on conflict (id) do nothing;

insert into public.resources (id, business_id, name) values
  ('d0000000-0000-4000-8000-000000000011', 'b0000000-0000-4000-8000-000000000001', 'Maca'),
  ('d0000000-0000-4000-8000-000000000021', 'b0000000-0000-4000-8000-000000000002', 'Cadeira 1')
on conflict (id) do nothing;

insert into public.services (id, business_id, name, duration_minutes, buffer_minutes, price_cents, position) values
  ('e0000000-0000-4000-8000-000000000011', 'b0000000-0000-4000-8000-000000000001', 'Manicure', 45, 15, 4000, 0),
  ('e0000000-0000-4000-8000-000000000012', 'b0000000-0000-4000-8000-000000000001', 'Escova', 45, 0, 6000, 1),
  ('e0000000-0000-4000-8000-000000000013', 'b0000000-0000-4000-8000-000000000001', 'Limpeza de pele', 60, 15, 12000, 2),
  ('e0000000-0000-4000-8000-000000000021', 'b0000000-0000-4000-8000-000000000002', 'Corte', 30, 0, 4500, 0),
  ('e0000000-0000-4000-8000-000000000022', 'b0000000-0000-4000-8000-000000000002', 'Barba', 30, 0, 3500, 1),
  ('e0000000-0000-4000-8000-000000000023', 'b0000000-0000-4000-8000-000000000002', 'Corte + barba', 60, 0, 7000, 2)
on conflict (id) do nothing;

-- Every professional does every service of their business.
insert into public.professional_services (business_id, professional_id, service_id)
select p.business_id, p.id, s.id
from public.professionals p
join public.services s on s.business_id = p.business_id
where p.business_id in ('b0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000002')
on conflict do nothing;

-- Services that need the resource.
insert into public.service_resources (business_id, service_id, resource_id) values
  ('b0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000013', 'd0000000-0000-4000-8000-000000000011'),
  ('b0000000-0000-4000-8000-000000000002', 'e0000000-0000-4000-8000-000000000023', 'd0000000-0000-4000-8000-000000000021')
on conflict do nothing;

-- Tuesday (2) to Saturday (6): 09:00–12:00 and 13:00–18:00.
insert into public.working_hours (business_id, professional_id, weekday, start_time, end_time)
select p.business_id, p.id, d.weekday, h.start_time, h.end_time
from public.professionals p
cross join generate_series(2, 6) as d(weekday)
cross join (values (time '09:00', time '12:00'), (time '13:00', time '18:00')) as h(start_time, end_time)
where p.business_id in ('b0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000002')
  and not exists (select 1 from public.working_hours w where w.professional_id = p.id);
