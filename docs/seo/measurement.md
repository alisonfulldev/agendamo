# Medição de SEO (Fase 9, 2026-10-16)

Objetivo de negócio: mais **links de agendamento ativos** (conta criada → link no ar → primeiro agendamento recebido), não só tráfego.

## Funil e onde cada etapa fica

| Etapa                               | Onde é registrada                                             | Parâmetros                                                                                                                 |
| ----------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Visualização de página de marketing | `site_events` (`type = 'page_view'`)                          | `path`, `template`, `niche`, `landing`, `session_id` anônimo                                                               |
| Clique em "Criar meu link"          | `site_events` (`type = 'cta_click'`)                          | idem                                                                                                                       |
| Conta criada                        | `audit_log` (`action = 'business.created'`), `details.source` | `page` (onde a conversa começou), `landing` (primeira página da sessão), `template`, `utm_*`, `referrer`, `variant`, `via` |
| Link publicado                      | O link entra no ar no mesmo momento da conta                  | (mesmo registro acima)                                                                                                     |
| Primeiro agendamento recebido       | `appointments` (menor `created_at` por negócio)               | junta com `business.created` pelo `business_id`                                                                            |

Templates (`src/lib/tracking/site-events.ts`): `home`, `nicho`, `subpagina`, `diretorio`, `agendamento`, `ferramenta`, `comparar`, `recursos`, `ajuda`, `precos`, `outro`.

### Privacidade (LGPD e regra 5)

- Sem cookies de rastreamento e sem GA4: o id de sessão é aleatório, fica no `sessionStorage` e some quando a aba fecha.
- Sem IP e sem dado pessoal na tabela; robôs e usuários logados (donas navegando) não são registrados.
- Leitura e escrita só pelo servidor (RLS ligada, sem política pública). Dados apagados após 400 dias (cron `cleanup`).
- Números agregados abaixo de 5 não devem ser exibidos em painéis (regra 5).
- Como não há cookies nem identificação, não há banner de consentimento a acrescentar; a Política de Privacidade já descreve as estatísticas anônimas.

## Consultas do funil (Supabase, SQL)

Visualizações e cliques por template e nicho, por semana:

```sql
select date_trunc('week', created_at) as semana, template, niche,
       count(*) filter (where type = 'page_view') as visualizacoes,
       count(*) filter (where type = 'cta_click') as cliques,
       count(distinct session_id) as sessoes
from public.site_events
where created_at >= now() - interval '90 days'
group by 1, 2, 3
having count(distinct session_id) >= 5
order by 1 desc, visualizacoes desc;
```

Contas criadas por página de entrada e template:

```sql
select details->'source'->>'landing' as entrada,
       details->'source'->>'template' as template,
       count(*) as contas
from public.audit_log
where action = 'business.created' and created_at >= now() - interval '90 days'
group by 1, 2
having count(*) >= 5
order by contas desc;
```

Ativação (primeiro agendamento) por página de entrada:

```sql
with criadas as (
  select business_id, created_at, details->'source'->>'landing' as entrada
  from public.audit_log
  where action = 'business.created' and created_at >= now() - interval '90 days'
), primeiro as (
  select business_id, min(created_at) as primeiro_agendamento
  from public.appointments group by 1
)
select c.entrada, count(*) as contas,
       count(p.business_id) as com_agendamento,
       round(100.0 * count(p.business_id) / count(*), 1) as ativacao_pct
from criadas c left join primeiro p using (business_id)
group by 1
having count(*) >= 5
order by contas desc;
```

## Search Console → BigQuery (exportação em massa)

Configuração (confira os passos atuais na ajuda oficial do Search Console, "Exportação de dados em massa"):

1. No Google Cloud, crie ou escolha um projeto com faturamento e ative a API do BigQuery.
2. No IAM do projeto, dê à conta de serviço `search-console-data-export@system.gserviceaccount.com` os papéis **BigQuery Job User** e **BigQuery Data Editor**.
3. No Search Console (propriedade de `meetchat.com.br`), abra Configurações › Exportação de dados em massa, informe o id do projeto, o nome do conjunto de dados (padrão `searchconsole`) e a região, e confirme.
4. A exportação começa a partir do dia da configuração (não traz histórico). As tabelas principais são `searchdata_site_impression` (por propriedade) e `searchdata_url_impression` (por URL), mais a `ExportLog`.

A posição exportada é zero-based: posição média = `sum_position / impressions + 1` na tabela por URL (`sum_top_position` na tabela por propriedade).

### O que medir por cluster

Agrupe as URLs por cluster com expressões regulares no caminho:

| Cluster             | Caminho                                   |
| ------------------- | ----------------------------------------- |
| Home                | `^/$`                                     |
| Nichos              | `^/[a-z-]+$` (exceto as seções abaixo)    |
| Subpáginas de nicho | `^/[a-z-]+/(reduzir-faltas                | agendar-pelo-whatsapp | agendar-pelo-instagram)$` |
| Diretório           | `^/[a-z-]+/[a-z0-9-]+$` (fora das seções) |
| Guias               | `^/agendamento/`                          |
| Ferramentas         | `^/ferramentas/`                          |
| Comparativos        | `^/comparar/`                             |
| Blog e ajuda        | `^/(recursos                              | ajuda)/`              |
| Perfis              | `/perfil$`                                |

Por cluster: impressões, cliques, CTR, posição média, número de URLs com impressões e, cruzando com o funil, contas criadas e ativação por página de entrada.

### Consultas úteis (BigQuery)

Canibalização (consultas em que mais de uma URL do site aparece):

```sql
select query, count(distinct url) as urls, sum(impressions) as impressoes,
       array_agg(distinct url limit 5) as exemplos
from `PROJETO.searchconsole.searchdata_url_impression`
where data_date >= date_sub(current_date(), interval 28 day)
  and not is_anonymized_query
group by query
having urls > 1 and impressoes >= 50
order by impressoes desc;
```

Oportunidades nas posições 8 a 20:

```sql
select query, url, sum(impressions) as impressoes, sum(clicks) as cliques,
       sum(sum_position) / sum(impressions) + 1 as posicao
from `PROJETO.searchconsole.searchdata_url_impression`
where data_date >= date_sub(current_date(), interval 28 day)
  and not is_anonymized_query
group by query, url
having posicao between 8 and 20 and impressoes >= 100
order by impressoes desc;
```

CTR baixo com muitas impressões (revisar título e description):

```sql
select url, sum(impressions) as impressoes, sum(clicks) as cliques,
       safe_divide(sum(clicks), sum(impressions)) as ctr,
       sum(sum_position) / sum(impressions) + 1 as posicao
from `PROJETO.searchconsole.searchdata_url_impression`
where data_date >= date_sub(current_date(), interval 28 day)
group by url
having impressoes >= 1000 and ctr < 0.01
order by impressoes desc;
```

## Scripts

- `npm run seo:coverage -- <url>`: compara o sitemap com as páginas indexáveis e verifica status, noindex, canonical, H1, título, description e JSON-LD de cada URL.
- `npm run seo:links -- <url>`: grafo de links internos (órfãs, profundidade, links quebrados, PageRank interno).
- `npm run seo:gate`: portão de qualidade das páginas programáticas.
