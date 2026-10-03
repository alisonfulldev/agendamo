-- "Pedir horário" (Free) now offers real free times: the request keeps the chosen slot and the
-- owner confirms it in the panel, which creates the appointment.

alter table public.booking_requests
  add column preferred_starts_at timestamptz,
  add column professional_id uuid,
  add column appointment_id uuid,
  add foreign key (professional_id, business_id)
    references public.professionals (id, business_id) on delete set null (professional_id),
  add foreign key (appointment_id, business_id)
    references public.appointments (id, business_id) on delete set null (appointment_id);

create index booking_requests_appointment_id_idx on public.booking_requests (appointment_id);
