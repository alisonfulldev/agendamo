# Testes de headline e CTA

## Como funciona

- Os testes ficam em `src/lib/experiments.ts` (`EXPERIMENTS`): id, página (`path`), template, `active` e as variantes. A variante `a` é sempre o controle (o texto dos arquivos de copy); as outras só trocam o título (`title`) e/ou o botão (`cta`).
- Cada visitante recebe um número de 0 a 999 no primeiro acesso a uma página do site (cookie `mc_ab`, 180 dias, sem dado pessoal). A variante é `número % quantidade de variantes`: estável para a mesma pessoa e dividida por igual.
- Robôs (Googlebot, Lighthouse etc.) nunca recebem número e veem sempre o controle: o conteúdo indexável não oscila. Metadata, schema e URLs nunca mudam com a variante.
- A variante vai junto nos eventos anônimos (`site_events.experiment`, ex.: `home-hero:b`) e na origem do cadastro (`audit_log` `business.created`, `details.source.experiment`).

## Testes no ar

| Teste            | Página       | Variantes                                                                                                     |
| ---------------- | ------------ | ------------------------------------------------------------------------------------------------------------- |
| `home-hero`      | `/`          | a: título e botão atuais · b: “Chega de responder ‘tem horário?’ o dia todo.” / “Criar meu link grátis agora” |
| `barbearia-hero` | `/barbearia` | a: título atual · b: “O cliente marca o corte. Você continua na máquina.”                                     |

Para encerrar um teste: `active: false` (todos voltam ao controle). Para adotar a vencedora: leve o texto dela para o arquivo de copy e desligue o teste.

## Como ler os resultados (Supabase, SQL)

Visualizações, cliques no CTA e taxa de clique por variante:

```sql
select experiment,
       count(distinct session_id) filter (where type = 'page_view') as sessoes,
       count(distinct session_id) filter (where type = 'cta_click') as sessoes_com_clique,
       round(100.0 * count(distinct session_id) filter (where type = 'cta_click')
             / nullif(count(distinct session_id) filter (where type = 'page_view'), 0), 1) as taxa_clique_pct
from public.site_events
where experiment like 'home-hero:%' and created_at >= now() - interval '28 days'
group by experiment
order by experiment;
```

Contas criadas por variante:

```sql
select details->'source'->>'experiment' as variante, count(*) as contas
from public.audit_log
where action = 'business.created'
  and details->'source'->>'experiment' like 'home-hero:%'
  and created_at >= now() - interval '28 days'
group by 1
order by 1;
```

## Quando decidir

- Espere pelo menos 2 semanas completas (o comportamento muda entre dias úteis e fim de semana).
- Compare **contas criadas** por variante, não só cliques: um título que dá mais clique e menos cadastro é pior.
- Com pouco tráfego, diferenças pequenas são ruído. Regra prática: só adote uma variante se ela tiver pelo menos 100 sessões com clique por variante e uma diferença que se mantenha em duas semanas seguidas.
- Números abaixo de 5 não são mostrados em painéis (regra 5).
