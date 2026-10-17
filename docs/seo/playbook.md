# Guia de operação de SEO

Onde está cada coisa e como mexer sem quebrar. Antes de publicar, siga `docs/seo/launch-checklist.md`.

## Mapa

| O quê                                | Arquivo                                                                           |
| ------------------------------------ | --------------------------------------------------------------------------------- |
| Metadata de qualquer página pública  | `src/lib/seo/metadata.ts` (`pageMetadata`)                                        |
| Dados estruturados                   | `src/lib/seo/structured-data.ts` + `<JsonLd>`                                     |
| Sitemap (índice e seções)            | `src/lib/seo/sitemaps.ts`, `src/lib/seo/sitemap-files.ts`                         |
| robots.txt e rastreadores de IA      | `src/lib/seo/robots.ts`                                                           |
| Portão de qualidade                  | `src/lib/seo/quality.ts` (`QUALITY_CONFIG`)                                       |
| Links contextuais                    | `src/lib/seo/entity-links.ts` (`ENTITY_LINKS`)                                    |
| Datas das páginas institucionais     | `src/content/site-pages.ts`                                                       |
| Páginas de nicho (hub)               | `src/content/niche-seo.ts`, `src/content/niche-pages.ts`, `src/brands/<nicho>.ts` |
| Guias e subpáginas por nicho         | `src/content/niche-guides/`                                                       |
| Guias transversais (`/agendamento`)  | `src/content/intent-pages.ts`                                                     |
| Ferramentas (`/ferramentas`)         | `src/content/tools.ts` + `src/lib/tools/`                                         |
| Comparativos (`/comparar`)           | `src/content/comparisons.ts`                                                      |
| Blog e ajuda (`/recursos`, `/ajuda`) | `src/content/articles.ts`                                                         |
| Perfis e diretório                   | `src/lib/public/indexable.ts`, `src/lib/directory/`                               |
| IndexNow                             | `src/lib/seo/indexnow.ts`, `npm run seo:indexnow`                                 |

## Adicionar um nicho

1. Crie a marca em `src/brands/<chave>.ts` (com `niche.route` e `niche.schemaType`) e registre em `src/brands/index.ts`.
2. Reserve a rota por migration em `reserved_slugs` (confira antes que nenhum negócio a usa).
3. Crie `src/app/<rota>/page.tsx` (como os outros nichos) e `src/app/<rota>/[parte]/page.tsx` (`nicheSegmentRoute("<chave>")`).
4. Escreva título, description e textos próprios em `src/content/niche-seo.ts`.
5. `npm test` e `npm run seo:gate`.

## Ativar uma onda de subpáginas de um nicho

1. Crie `src/content/niche-guides/<nicho>.ts` (tipo `NicheGuide`) com `published: false` e escreva os temas com texto realmente do nicho.
2. Registre em `src/content/niche-guides/index.ts`.
3. Rode `npm run seo:gate`: veja a semelhança com os mesmos temas de outros nichos (máximo 70%) e o mínimo de blocos.
4. Saúde: revisão de especialista antes de ligar.
5. Ligue `published: true`. As subpáginas entram no sitemap, a página do nicho ganha os links e o hub ganha o bloco de particularidades.

## Adicionar uma subpágina (tema) nova

1. Acrescente o tema em `NICHE_TOPICS` e `TOPIC_LABELS` (`src/content/niche-guides/types.ts`). O nome do tema não pode ser nome de cidade (temas têm prioridade sobre cidades na URL).
2. Escreva o tema só nos nichos que têm conteúdo diferenciado; os outros continuam 404.
3. Se houver guia transversal com a mesma intenção, ligue por `nicheTopic` em `src/content/intent-pages.ts`.

## Adicionar um comparativo

1. Em `COMPETITORS`, cadastre o concorrente com `sources` (URLs oficiais) e `verifiedAt`. Cada fato precisa de `source`; o que não foi confirmado fica `null` ("Não verificado").
2. Em `COMPARISONS`, crie a página (`kind`: `vs`, `alternativas` ou `melhores`) com `published: false`, revise e ligue.
3. Reverifique as fontes a cada 6 meses e atualize `verifiedAt`.

## Adicionar uma ferramenta

1. Lógica em função pura em `src/lib/tools/` com teste.
2. Componente cliente em `src/components/tools/`.
3. Texto em `src/content/tools.ts` e o `case` no `Tool` de `src/app/ferramentas/[ferramenta]/page.tsx`.

## Adicionar um artigo (blog ou ajuda)

1. Acrescente em `ARTICLES` (`src/content/articles.ts`) com `status: "draft"`.
2. Autor real (pessoa com nome e página) quando houver; datas reais.
3. `related` só com caminhos existentes (o teste confere). Ligue `status: "published"`.

## Podar ou consolidar páginas sem tração

1. Critério sugerido: 6 meses no ar, menos de 50 impressões no período e nenhuma conta criada com ela como entrada (`docs/seo/measurement.md`).
2. Consolidar: escolha a página que fica, leve o melhor conteúdo para ela e faça 301 da antiga para a nova em `next.config.ts` (`redirects`), direto para o destino final (sem cadeia).
3. Tire a página antiga das fontes de conteúdo (o sitemap sai junto) e troque os links internos para a nova.
4. Rode `npm run seo:links` e `npm run seo:coverage`: nenhum link interno deve apontar para o 301.

## Política de atualização de conteúdo

- Revisar a cada 6 meses (ou quando o produto mudar): fatos do produto, preços (vêm do config), links e capturas.
- Mudou o texto? Atualize `updatedAt`/`dateModified` (alimenta o sitemap e o "Atualizado em"). Não mude a data sem mudar o conteúdo.
- Comparativos: reverificar fontes e `verifiedAt`.
- Prompts de IA (`docs/seo/ai-visibility-prompts.md`): rodar mensalmente e corrigir informação errada na página certa.

## Rastreadores de IA

Todos liberados por padrão. Para bloquear um, acrescente o user agent em `BLOCKED_CRAWLERS` (`src/lib/seo/robots.ts`). `Google-Extended` e `Applebot-Extended` controlam só o uso em IA e treino, não a busca normal. `/llms.txt` é experimental e gerado a partir das mesmas fontes de conteúdo.
