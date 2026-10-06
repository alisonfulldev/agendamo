-- "Outro / Geral" niche (2026-10-06): new segment, the free text "o que você faz" of those who pick
-- it, and every business whose niche is not a current one moves to it (services untouched).

alter table public.businesses drop constraint businesses_segment_check;
alter table public.businesses add constraint businesses_segment_check check (
  segment in (
    'beauty', 'barber', 'aesthetics', 'nails', 'lash_brow', 'tattoo',
    'psychology', 'psychoanalysis', 'physio', 'nutrition', 'speech_therapy', 'occupational_therapy',
    'psychopedagogy', 'dentistry', 'medical', 'podiatry', 'chiropractic', 'osteopathy',
    'acupuncture', 'massage_therapy', 'integrative_therapy', 'pilates', 'yoga', 'personal_trainer',
    'pet_grooming', 'veterinary', 'tutoring', 'photography', 'consulting', 'auto_detailing',
    'sports_court', 'general'
  )
);

/** What the owner said they do when picking "Outro" (also the first profile description). */
alter table public.businesses
  add column niche_description text
  check (niche_description is null or char_length(niche_description) <= 200);

update public.businesses
set brand_key = 'general', segment = 'general'
where brand_key not in (
  'beauty', 'barber', 'aesthetics', 'nails', 'lash-brow', 'tattoo',
  'psychology', 'psychoanalysis', 'physio', 'nutrition', 'speech-therapy', 'occupational-therapy',
  'psychopedagogy', 'dentistry', 'medical', 'podiatry', 'chiropractic', 'osteopathy',
  'acupuncture', 'massage-therapy', 'integrative-therapy', 'pilates', 'yoga', 'personal-trainer',
  'pet-grooming', 'veterinary', 'tutoring', 'photography', 'consulting', 'auto-detailing',
  'sports-court', 'general'
);
