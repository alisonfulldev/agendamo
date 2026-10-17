# Relatório consolidado de SEO (Fases 0 a 10, 2026-10-16)

Auditoria inicial: `docs/seo/audit.md`. Operação: `docs/seo/playbook.md`. Checklist: `docs/seo/launch-checklist.md`. Medição: `docs/seo/measurement.md`. Perfis e privacidade: `docs/seo/perfis-e-privacidade.md`. Monitoramento em IA: `docs/seo/ai-visibility-prompts.md`.

## O que foi feito

| Fase | Entregas                                                                                                                                                                                                                                                                                                                                                                                       |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | Auditoria; correção de XSS no JSON-LD do perfil.                                                                                                                                                                                                                                                                                                                                               |
| 1    | `pageMetadata` central; perfis, chat e chat embutido na marca do negócio no domínio compartilhado (sem `?brand=`); `/precos` com os dois níveis (D1); sitemap index com `lastmod` real; robots com rastreadores de IA configuráveis; CTAs `?criar=` com `nofollow`; 404 útil; IndexNow; slugs reservados; recusa de nomes "MeetChat"; "Denunciar este perfil"; e-mail de contato configurável. |
| 2    | Builders tipados de JSON-LD (`Organization`, `WebSite`, `SoftwareApplication` com as duas `Offer`, `BreadcrumbList`, `FAQPage`, `BlogPosting`, `LocalBusiness` com subtipo por nicho, `Service`/`Offer`, `ReserveAction`, `ItemList`, `WebApplication`) e testes.                                                                                                                              |
| 3    | Modelo de dados por nicho, 15 subpáginas (5 pilotos × 3 temas), blocos condicionais no hub, portão de qualidade (semelhança e blocos mínimos) rodando antes do build.                                                                                                                                                                                                                          |
| 4    | 8 guias transversais (`/agendamento`), 3 ferramentas (`/ferramentas`), comparativos com fonte e data (`/comparar`, 1 exemplo).                                                                                                                                                                                                                                                                 |
| 5    | `isIndexable` (com opção de sair das buscas), suspenso → página do nicho (307), diretório `/{nicho}/{cidade}`, selo com nicho, dica de divulgação no onboarding.                                                                                                                                                                                                                               |
| 6    | Breadcrumbs em todas as páginas do site, links contextuais por entidade com limite por página, rodapé com as seções, `npm run seo:links`.                                                                                                                                                                                                                                                      |
| 7    | Blog (`/recursos`) e ajuda (`/ajuda`) com sumário, autor, datas, fontes, relacionados, CTA e `BlogPosting`/`Article`; 3 artigos e 2 de ajuda.                                                                                                                                                                                                                                                  |
| 8    | Respostas diretas e datas nas páginas, `/llms.txt` (experimental), 250 prompts de monitoramento.                                                                                                                                                                                                                                                                                               |
| 9    | Eventos anônimos de funil (`site_events`), atribuição por página de entrada e template no cadastro, consultas do funil e do Search Console no BigQuery, `npm run seo:coverage`.                                                                                                                                                                                                                |
| 10   | Testes de SEO no `npm test`, workflow de CI (checagens a cada push; auditoria semanal do site publicado), checklist e playbook.                                                                                                                                                                                                                                                                |

Resultado local (build de produção): 72 URLs no sitemap, todas 200, sem `noindex`, canonical própria, 1 H1, títulos e descriptions únicos, JSON-LD válido; nenhuma página órfã, nenhuma a mais de 3 cliques, nenhum link quebrado ou para redirect.

## Banco (migrations aplicadas no remoto)

- `20261016100000_reserve_seo_slugs.sql`: reserva `recursos`, `ferramentas`, `comparar`, `meetchat`, `meet-chat` (conferido antes: nenhum negócio usava).
- `20261016110000_site_events.sql`: tabela anônima de eventos de funil, RLS sem acesso público, limpeza após 400 dias.

## Depende de decisão sua

1. **Informações institucionais**: CNPJ, razão social, endereço, telefone e redes sociais da MeetChat (entram em `src/brands/platform.ts` → `Organization`). Nada foi inventado.
2. **E-mail de contato** em outro domínio (`contato@brandcodesolutions.com.br`): configurável por `NEXT_PUBLIC_CONTACT_EMAIL`, não foi trocado.
3. **Revisão especialista** dos textos de psicologia (`TODO(revisão-especialista)` em `src/content/niche-guides/psychology.ts`) antes de publicar novas páginas de saúde.
4. **Autor real** dos artigos (`TODO(conteúdo)` em `src/content/articles.ts`); hoje é "Equipe MeetChat" (organização).
5. **Dados de concorrentes** (Trinks, AgendaPro, Booksy etc.): o modelo existe; só entram com fonte pública e data.
6. **Search Console**: checar quais URLs de `/explorar` têm impressões antes dos 301 para o diretório (D4) e configurar a exportação para o BigQuery.
7. **Textos legais**: termos e privacidade ainda mostram "Texto-base para revisão jurídica"; a privacidade fala em "cookie anônimo" para estatísticas, e as estatísticas novas usam `sessionStorage` (sem cookie). Ajustar na revisão jurídica.

## Todos os `TODO(...)`

- `src/content/niche-guides/psychology.ts`: `TODO(revisão-especialista)`.
- `src/content/articles.ts`: `TODO(conteúdo)` (autor real).

Nenhum dos dois aparece no HTML.

## Próximos passos recomendados

1. Depois do deploy: `npm run seo:coverage` e `npm run seo:links` contra produção, `npm run seo:indexnow`, enviar o sitemap no Search Console.
2. Segunda onda de nichos (cílios e sobrancelhas, fisioterapia, nutrição, odontologia, pilates), começando pelos de maior busca e menor semelhança.
3. Comparativos com 2 ou 3 concorrentes principais, com fontes.
4. Acompanhar o funil por página de entrada (consultas em `measurement.md`) e podar ou consolidar páginas sem tração após 6 meses.
5. Rodar os 250 prompts de IA mensalmente e corrigir informação errada na página certa.
