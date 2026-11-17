-- Página do anúncio da Meta (/ativar, 2026-11-17): a conta nasce em "demonstração", com a agenda
-- liberada só até o agendamento de teste da dona (no máximo 1 hora). Depois disso a conta fica no
-- modo de espera (pedidos pelo WhatsApp) até o pagamento. Sem teste de 14 dias.
alter table public.businesses
  add column activation_demo boolean not null default false;

-- /ativar é uma rota: nenhum negócio pode usar esse endereço.
insert into public.reserved_slugs (slug) values ('ativar') on conflict do nothing;
