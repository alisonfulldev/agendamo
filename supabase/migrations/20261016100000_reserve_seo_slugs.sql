-- SEO sections (D3, 2026-10-16): /recursos, /ferramentas and /comparar are site pages, so no
-- business may take these links. "meetchat" variants are reserved so no page passes for the
-- platform (moderation, D2). Checked before applying: no business used any of them.
-- ("ajuda", "blog", "precos" and "agendamento" were already reserved.)
insert into public.reserved_slugs (slug) values
  ('recursos'), ('ferramentas'), ('comparar'), ('meetchat'), ('meet-chat')
on conflict do nothing;
