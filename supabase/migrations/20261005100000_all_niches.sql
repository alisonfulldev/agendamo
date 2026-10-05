-- Agendamo atende todo negócio com hora marcada (2026-10-05): novos segmentos e os slugs das
-- páginas de nicho do site reservados (um negócio com esse slug ficaria inacessível).

alter table public.businesses drop constraint businesses_segment_check;
alter table public.businesses add constraint businesses_segment_check check (
  segment in (
    'beauty', 'barber', 'aesthetics', 'nails', 'lash_brow', 'tattoo',
    'psychology', 'psychoanalysis', 'physio', 'nutrition', 'speech_therapy', 'occupational_therapy',
    'psychopedagogy', 'dentistry', 'medical', 'podiatry', 'chiropractic', 'osteopathy',
    'acupuncture', 'massage_therapy', 'integrative_therapy', 'pilates', 'yoga', 'personal_trainer',
    'pet_grooming', 'veterinary', 'tutoring', 'photography', 'consulting', 'auto_detailing',
    'sports_court'
  )
);

insert into public.reserved_slugs (slug) values
  ('psicanalise'), ('nutricao'), ('fonoaudiologia'), ('terapia-ocupacional'), ('psicopedagogia'), ('quiropraxia'),
  ('osteopatia'), ('acupuntura'), ('massoterapia'), ('pilates'), ('podologia'), ('terapias-integrativas'),
  ('manicure'), ('cilios-e-sobrancelhas'), ('odontologia'), ('consultorios'), ('yoga'), ('banho-e-tosa'),
  ('veterinaria'), ('aulas'), ('fotografia'), ('consultoria'), ('estetica-automotiva'), ('quadras')
on conflict do nothing;
