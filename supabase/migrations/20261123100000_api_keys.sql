-- IA própria (2026-11-23): a dona conecta a IA dela (ex.: Claude no WhatsApp) à agenda pelo
-- servidor MCP /api/v1/mcp ou pelas rotas REST /api/v1/*. A chave aparece uma vez no painel;
-- aqui fica só o SHA-256 dela. Uma chave ativa por negócio (gerar outra revoga a anterior).
create table public.api_keys (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  key_hash text not null unique,
  -- Começo da chave, para a dona reconhecer qual está ativa ("mc_live_ab12…").
  prefix text not null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);

create unique index api_keys_one_active_per_business
  on public.api_keys (business_id) where revoked_at is null;

-- Só o servidor (service role) lê e grava: nenhuma política para usuários.
alter table public.api_keys enable row level security;
