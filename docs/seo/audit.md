# Auditoria de SEO — Fase 0 (2026-10-16)

Escopo: leitura do código em `main` (commit 8daf926). Nada foi alterado no código; este arquivo é a única mudança.
Baseline: `typecheck` ok, `vitest` 45 arquivos / 793 testes passando. `build` e `lint` não rodados nesta fase.

## 1. Mapa do que existe

| Área                  | Onde                                                                                                                                                                                                           | Situação                                                                                                                                                                                                                    |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Roteamento            | App Router (`src/app`), Next 16.3.8, proxy em `src/proxy.ts`                                                                                                                                                   | Tudo é renderizado no servidor e dinâmico (o layout lê `headers()` para a marca). Sem SSG/ISR.                                                                                                                              |
| Home                  | `src/app/page.tsx` + `src/components/home/home-page.tsx`, textos em `src/content/home.ts`                                                                                                                      | SSR. H1, seções, FAQ (`<details>`, texto no HTML), links de nicho e rodapé estão no HTML inicial. Teste A/B por `?v=b`.                                                                                                     |
| Páginas de nicho (31) | Uma pasta por rota (`src/app/barbearia/page.tsx`…) que chama `NichePage` + `nicheMetadata` (`src/components/sales/niche-page.tsx`)                                                                             | Mesmo componente da home, textos por nicho em `src/content/niche-seo.ts` (título, description, H1, intro, FAQ) com fallback em `src/content/niche-pages.ts` e `src/brands/*`.                                               |
| Metadata              | Por página (`generateMetadata` / objetos), `metadataBase` no layout                                                                                                                                            | Sem helper central. Canonicals limpos na home, nichos, perfis e portal. Twitter só em home/nichos.                                                                                                                          |
| Parâmetros            | `?criar=1`, `&ramo=`, `?nome=`, `?v=b`, `?brand=`, `?perfil=1`, `?preview=`                                                                                                                                    | CTAs são `<a href="?criar=1…">` (links internos para URL com parâmetro). Canonical aponta para a URL limpa; robots bloqueia `?criar=`.                                                                                      |
| Sitemap               | `src/app/sitemap.xml/route.ts`                                                                                                                                                                                 | Arquivo único. Home + 31 nichos + termos/privacidade + perfis completos. `lastmod` dos nichos/home = `new Date()` no carregamento do módulo (falso). Portal só entra quando a marca tem domínio próprio (hoje nenhuma tem). |
| robots.txt            | `src/app/robots.txt/route.ts`                                                                                                                                                                                  | Correto no essencial: bloqueia painel, admin, api, auth, cadastro, entrar, demo, `?criar=`; previews com `Disallow: /`. Não bloqueia CSS/JS nem rastreadores de IA.                                                         |
| JSON-LD               | Home/nichos: `Organization`, `SoftwareApplication`, `FAQPage`, `BreadcrumbList` (inline em `home-page.tsx`). Perfis: `LocalBusiness` simples (`src/app/[slug]/load.ts`)                                        | Sem componente tipado nem testes. `LocalBusiness` sem subtipo, sem `Service`/`Offer`/`ReserveAction`/`url`.                                                                                                                 |
| Perfis públicos       | `/<slug>` (chat, canonical → perfil) e `/<slug>/perfil` (indexável)                                                                                                                                            | SSR. Regra de completude `isCompleteProfile` (foto, bio ≥ 30, cidade, ≥ 3 serviços com preço) espelhada na RPC `indexable_businesses`. Incompletos: `noindex, follow`.                                                      |
| Diretório             | `/explorar`, `/explorar/[cidade]/[servico]`, `/explorar/[cidade]/[bairro]/[servico]` (`src/lib/portal/*`)                                                                                                      | Já existe, por marca, com `MIN_INDEXABLE_LISTING = 3` e RPC `indexable_portal_pages`.                                                                                                                                       |
| Imagens OG            | `src/app/og/route.tsx` (`/og?nicho=`)                                                                                                                                                                          | Ok.                                                                                                                                                                                                                         |
| Fontes                | `next/font/google` (`src/brands/fonts.ts`), Poppins/Inter com preload                                                                                                                                          | Ok.                                                                                                                                                                                                                         |
| Performance           | Mockup do celular é client component com greeting do servidor; `below-fold` usa `content-visibility`; conversa de criação carregada sob demanda                                                                | Sem `next/image` nas páginas de venda (só SVG pequeno com width/height). Sem scripts de terceiros além do Sentry.                                                                                                           |
| Cabeçalhos            | `src/lib/security-headers.ts` via proxy                                                                                                                                                                        | CSP, frame-ancestors, HSTS etc. já existem.                                                                                                                                                                                 |
| 404/500               | Sem `src/app/not-found.tsx` (usa o padrão do Next); `src/app/[slug]/not-found.tsx` existe; `global-error.tsx`                                                                                                  | 404 real, porém genérico e sem links.                                                                                                                                                                                       |
| Analytics             | Primeira parte: `/api/events` (eventos anônimos por negócio, regra 5), `/api/portal-events`; atribuição do cadastro grava `utm_*`, `page`, `referrer`, `via`, `variant` (`src/components/creation/actions.ts`) | Sem GA4/GTM e sem banner de cookies (não há cookies de rastreamento).                                                                                                                                                       |
| Slugs reservados      | Tabela `reserved_slugs` (migrations core, portal, niche…)                                                                                                                                                      | `blog`, `ajuda`, `explorar`, rotas de nicho etc. já reservados. Rotas novas no primeiro nível exigem migration nova.                                                                                                        |

## 2. Achados por prioridade

### P0 — corrigir antes de qualquer coisa

1. **XSS no JSON-LD do perfil.** `src/app/[slug]/perfil/page.tsx` usa `.replace(/</g, "<")` — dentro de uma string JS isso é o próprio `<`, então não escapa nada. A bio é texto livre da dona; uma bio com `</script><script>…` executa na página pública (a CSP permite `'unsafe-inline'`). A página do chat (`/<slug>`) usa `"\\u003c"` e está correta. Correção de 1 caractere; recomendo fazer já, fora das fases.
2. **Perfis de negócios fora da marca padrão não são indexáveis no domínio compartilhado.** Em meetchat.com.br a marca vem de `?brand=` ou cookie; o Googlebot não tem cookie, então cai em `DEFAULT_BRAND` (beauty). Para um negócio de outro nicho, `/<slug>/perfil` faz `redirect()` (307) para `/<slug>/perfil?brand=<nicho>`, cuja canonical volta para `/<slug>/perfil`. Resultado: a URL do sitemap redireciona e a canonical aponta para uma URL que redireciona. O mesmo vale para `/explorar` (o Google só vê o portal de beauty, e as canonicals sem `?brand=` colidem entre marcas). Mexe em resolução de marca/domínio → precisa de plano aprovado (CLAUDE.md).

### P1 — fundação

3. `lastmod` falso no sitemap (data do deploy). Precisa de data real por conteúdo (campo `updatedAt` nos arquivos de conteúdo).
4. Sitemap único, sem índice; portal fora do sitemap no domínio compartilhado.
5. Links internos para `?criar=1&ramo=…` em todo CTA (vários por página). O robots bloqueia, a canonical está limpa; o risco é baixo, mas dá para trocar por `<button>` com fallback ou manter o `<a>` com `rel="nofollow"`. Proponho manter o `<a>` (funciona sem JS) com `rel="nofollow"`.
6. Sem helper central de metadata: Twitter/OG/robots inconsistentes entre templates; `/explorar` e termos/privacidade sem OG próprio.
7. Sem 404 útil no nível do site.
8. JSON-LD sem tipos nem testes; `Organization` repetida em cada página sem `@id`; sem `WebSite`.
9. Copy contraditória com a decisão de 2026-10-13: todas as 31 descriptions de nicho terminam com **"Teste grátis, sem cartão."** (`src/content/niche-seo.ts`), e a home vende "Agendamento online grátis". Ver decisão D1.

### P2 — crescimento

10. Páginas de nicho com estrutura idêntica (mesmo componente; diferenças em intro/FAQ/títulos). Não há subpáginas de cauda longa nem portão de similaridade.
11. Sem blog, central de ajuda, ferramentas ou comparativos.
12. Perfil: `LocalBusiness` sem subtipo, `url`, `Service`/`Offer`, `ReserveAction`, `geo`; `aggregateRating` vem de avaliações reais da plataforma (permitido, mas tratar com cuidado).
13. Sem IndexNow, sem `llms.txt`.

## 3. Conflitos entre o pedido e as regras do projeto (CLAUDE.md)

| Pedido                                                       | Regra do projeto                                                        | Como proponho seguir                                                                                                                                                           |
| ------------------------------------------------------------ | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Um commit/PR por fase                                        | "Não rode comandos de git"                                              | Não vou commitar. Entrego cada fase separada, com a lista de arquivos, para você versionar.                                                                                    |
| Blog em MDX                                                  | Não adicionar bibliotecas sem perguntar                                 | Conteúdo em arquivos TypeScript tipados (padrão de `src/content`), sem dependência nova. MDX só se você aprovar `@next/mdx`.                                                   |
| GA4 e eventos de funil                                       | Regra 5 (sem identificar visitantes); stack fixa                        | Usar a analytics própria (`page_events`/atribuição já gravada no cadastro). Eventos novos de plataforma exigem tabela/migration → plano antes. Sem GA4 salvo pedido explícito. |
| `SoftwareApplication` com "oferta gratuita"                  | Plano único pago (R$ 29,90) com teste; preços fora das páginas públicas | Ver D1. Até decidir: sem `offers` no schema.                                                                                                                                   |
| Perfil com 410 / diretório novo `/{nicho}/{cidade}`          | Mexe em domínios/portal/banco → plano antes                             | Proposta na Fase 5, depois de aprovada.                                                                                                                                        |
| Scripts `scripts/seo/*.ts`                                   | Node 22.22 executa `.ts` sem flag                                       | Ok, sem `tsx`.                                                                                                                                                                 |
| Rotas novas no primeiro nível (`/ferramentas`, transversais) | Colidem com `/<slug>` de negócios                                       | Migration em `reserved_slugs` (com checagem de slugs já usados) → aprovação. Ver D3.                                                                                           |

## 4. Suposições (opção conservadora)

- Domínio canônico: `https://meetchat.com.br` (`NEXT_PUBLIC_APP_URL`). Nenhum nicho tem domínio próprio hoje (todos `*.example.com`); o código continua suportando domínio por marca (regra 14).
- `/explorar` continua existindo até a Fase 5; nenhuma URL atual muda sem 301.
- Rastreadores de IA permitidos por padrão; lista configurável.
- Nada de preço, teste grátis, depoimento, número de clientes ou dado de concorrente sem fonte nas páginas públicas.

## 5. Informação institucional que falta (não inventar)

- CNPJ, razão social, endereço: não existem no repositório.
- Redes sociais da MeetChat (`sameAs`): `PLATFORM.socialLinks` / brands — a confirmar; nada será preenchido sem você.
- E-mail de contato está em outro domínio (`contato@brandcodesolutions.com.br`). Vai ficar configurável (variável/config), sem troca.
- Autor do blog (nome real, bio) para `BlogPosting`.
- Revisão especialista para conteúdo de saúde (psicologia e demais `ymyl`).

## 6. Plano por fase (ajustado ao repositório)

- **Fase 1 — fundação:** corrigir P0-1; resolver P0-2 (plano à parte: no domínio compartilhado, perfil e portal usam a marca do negócio/rota em vez do cookie, sem redirect); `src/lib/seo/metadata.ts` (helper único: title, description, canonical limpo, OG, Twitter, robots); sitemap index (`/sitemap.xml` → `/sitemaps/{site,nichos,perfis,diretorio,...}.xml`) com `lastmod` real; robots com rastreadores de IA configuráveis; `rel="nofollow"` nos CTAs `?criar=`; `src/app/not-found.tsx` útil; IndexNow (`INDEXNOW_KEY`, rota da chave e notificação a partir das mudanças de conteúdo/perfil); revisão de CLS do mockup.
- **Fase 2 — JSON-LD:** `src/lib/seo/jsonld/*` tipado + `<JsonLd>` com escape correto, `@id` estáveis, testes Vitest.
- **Fase 3 — nichos:** modelo tipado por nicho (estende `niche-seo.ts`), blocos condicionais, subpáginas `/{nicho}/{tema}` só para os 5 pilotos (pastas finas por nicho, como hoje), portão de similaridade (shingling, sem dependência) rodando em teste/CI, flag `published`.
- **Fase 4 — transversais, comparativos, ferramentas:** ver D3 para as URLs.
- **Fase 5 — perfis e diretório:** proposta de arquitetura antes de codar.
- **Fases 6–10:** como pedido, com as adaptações da seção 3.

## 7. Decisões pendentes

- **D1 — "grátis":** a home diz "Agendamento online grátis" e as descriptions dos nichos dizem "Teste grátis, sem cartão" (contra a decisão de 2026-10-13). Manter "grátis" (criar conta e o link em modo WhatsApp são de fato gratuitos) ou trocar por algo sem promessa de gratuidade? E o `SoftwareApplication` deve ter `offers` com preço 0?
- **D2 — P0-2:** aprovar a mudança na resolução de marca para perfis/portal no domínio compartilhado.
- **D3 — URLs novas:** transversais e ferramentas sob prefixo (`/recursos/…`, `/ferramentas/…`, `/comparar/…`, `/blog/…`, `/ajuda/…`), exigindo poucas palavras reservadas, ou no primeiro nível (`/lembrete-automatico`), exigindo uma reserva por página?
- **D4 — Diretório:** novo `/{nicho}/{cidade}` com 301 de `/explorar/...`, ou manter `/explorar` e só corrigir a indexação?
