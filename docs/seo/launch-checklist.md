# Checklist de lançamento de páginas e templates

Use antes de publicar qualquer página nova (guia, subpágina de nicho, ferramenta, comparativo, artigo) ou template.

## Conteúdo

- [ ] Responde à busca nas primeiras linhas (resposta direta), em pt-BR.
- [ ] Só cita recursos que o produto tem hoje (confira no código ou no CLAUDE.md). Lembrete = e-mail; nada de WhatsApp automático.
- [ ] "Grátis" só com o limite ao lado (D1). Preços só de `src/lib/plans.ts`, nunca escritos à mão.
- [ ] Sem estatística, depoimento, avaliação, número de clientes ou dado de concorrente sem fonte. Concorrente: `fonte` e `verificadoEm` preenchidos; o que não foi verificado fica `null`.
- [ ] Saúde (`ymyl`): aviso visível e `TODO(revisão-especialista)` até a revisão; nada de conduta clínica.
- [ ] `updatedAt` / `dateModified` com a data real da mudança do texto.

## Técnica

- [ ] Título único (até 65 caracteres) e description única (70 a 160): `npm test` (pages.test.ts) confere.
- [ ] Um único `<h1>`.
- [ ] Metadata por `pageMetadata` (canonical limpa, sem parâmetros; OG e Twitter).
- [ ] Breadcrumb visível e em JSON-LD (`<Breadcrumbs>`).
- [ ] JSON-LD pelos builders de `src/lib/seo/structured-data.ts`, renderizado por `<JsonLd>`; FAQPage só com FAQ visível.
- [ ] Página no sitemap certo (`src/lib/seo/sitemaps.ts`) e fora dele se for `noindex`.
- [ ] Pelo menos um link interno chegando à página (índice da seção, página do nicho, "Veja também") e links saindo para páginas relacionadas.
- [ ] Rota nova no primeiro nível? Use um prefixo existente (D3). Se for inevitável, reserve o slug por migration (`reserved_slugs`) depois de checar que nenhum negócio o usa.
- [ ] `npm run seo:gate` passa (páginas programáticas).

## Depois do deploy

- [ ] `npm run seo:coverage -- https://meetchat.com.br` sem problemas.
- [ ] `npm run seo:links -- https://meetchat.com.br` sem órfãs, links quebrados ou redirects.
- [ ] `npm run seo:indexnow` (com `INDEXNOW_KEY`) para avisar Bing e outros.
- [ ] No Search Console: inspecionar a URL e pedir indexação das páginas mais importantes.
