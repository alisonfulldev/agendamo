# Direção de design (2026-10-17)

## Conceito: "a conversa que vira horário"

O site é feito do próprio produto. Cada seção mostra um pedaço real do caminho (o link na bio, a conversa, o lembrete, a agenda) em mockups que são componentes React, não imagens. Tom caloroso e confiante: fundo creme quente, vinho da marca, tipografia com personalidade nos títulos e leitura limpa no corpo. Funciona para barbearia e para consultório porque cada página de nicho usa a paleta do nicho; os componentes só leem as variáveis do tema.

## Paleta (plataforma)

Base `#A8466D` (vinho), em `src/brands/platform.ts`. A escala de 10 tons e os tons de seção são derivados no CSS com `color-mix` a partir das variáveis do tema, então valem para qualquer nicho, inclusive o tema escuro da barbearia, sem cor literal fora dos arquivos de marca.

| Token                        | Uso                                   | Valor (plataforma)                         |
| ---------------------------- | ------------------------------------- | ------------------------------------------ |
| `primary` / `button`         | marca, CTA                            | `#A8466D`                                  |
| `background`                 | fundo creme quente                    | `#FBF6F3`                                  |
| `surface`                    | cartões, mockups                      | `#FFFFFF`                                  |
| `text`                       | texto principal                       | `#2B1D23`                                  |
| `muted`                      | texto secundário (AA sobre o fundo)   | `#6B5560`                                  |
| `accent`                     | fundo rosado das seções de tom quente | `#F5E4EA`                                  |
| `success` (novo, opcional)   | confirmação                           | `#1F7A4D`                                  |
| `warning` (novo, opcional)   | alerta                                | `#9A5B00`                                  |
| `danger`                     | erro                                  | `#B42318`                                  |
| `--brand-50` … `--brand-900` | escala derivada                       | `color-mix` de `primary` com fundo e texto |

Nichos sem `success`/`warning` usam a cor da marca para confirmação (alerta continua `danger`).

Contraste: texto `#2B1D23` sobre `#FBF6F3` ≈ 15:1; `muted` `#6B5560` sobre `#FBF6F3` ≈ 6.3:1 e sobre o rosado `#F5E4EA` ≈ 5.6:1; branco sobre `#A8466D` ≈ 5.6:1; `#A8466D` sobre o fundo ≈ 5.2:1; `success` e `warning` sobre branco ≈ 5.3 e 5.4:1 (todos AA).

## Tipografia

- Títulos: **Fraunces** (serifa display suave, variável), peso 600, `opsz` alto, letra levemente arredondada: dá calor e assinatura sem parecer corporativo.
- Corpo: **Figtree** (sans humanista, leitura excelente no celular).
- Carregadas por `next/font` com fallback métrico (sem layout shift), pré-carregadas só as da plataforma.
- Escala (celular → desktop): H1 40 → 64 px, H2 30 → 44 px, H3 20 → 24 px, corpo 17 → 18 px, linha 1,5 a 1,6. Preços com `tabular-nums`.

## Layout e ritmo

- Grid de 4/8/12 colunas (`max-w-6xl`, gutter 20 px no celular), seções com 72 a 112 px de respiro vertical.
- Ritmo de seções: creme (claro) → rosado (tom quente) → creme → escuro pontual (CTA final, cor do texto como fundo) → creme.
- Cantos 16 a 28 px, bordas de 1 px a 10% do texto, sombras em duas camadas (contato curto + difusa tingida pela marca), gradientes só como luz de fundo.
- Sem grade de cards ícone + título + texto. Variação: portas de dor com cena em primeira pessoa, linhas alternadas texto/mockup, tabela de comparação, cartões de nicho por grupo.

## Movimento

150 a 300 ms com `cubic-bezier(.2,.8,.2,1)`; revelação ao rolar com `animation-timeline: view()` (sem JS, só onde o navegador suporta); o celular repete o fluxo em loop leve e responde ao toque; a agenda mostra o horário cancelado voltando a ficar livre. Tudo desligado com `prefers-reduced-motion`.

## Componentes (biblioteca `src/components/landing/`)

`LandingHeader`, `Hero`, `PhoneBooking` (interativo), `ReminderEmail`, `AgendaDay`, `BioLink`, `PainDoors`, `PainScenes`, `StoryRows` (texto ↔ mockup), `CompareTable` (WhatsApp/caderno × link), `NicheGrid`, `Objections`, `PlansTeaser` (dois níveis sem valores → `/precos`), `FaqAccordion`, `ClosingCta`, `IntentFooter`, `StickyCta` (existente).

## Três layouts-chave

1. **Home**: header → hero (título + mockup do celular) → "Qual dessas é a sua?" (3 portas de dor) → "Como fica com o link" (4 linhas texto/mockup: bio, conversa, lembrete, agenda) → comparação WhatsApp/caderno × link → por profissão → "Mas e se…" (objeções) → planos sem valores → FAQ → CTA escuro → rodapé por intenção.
2. **Hub de nicho** (barbearia): mesmo esqueleto com copy, serviços, barbeiros e cenas do nicho, mais ferramentas e guias do nicho, cidades do diretório e nichos próximos.
3. **Subpágina por dor** (próxima etapa): hero com a dor nomeada, cena → virada no mockup → objeções → mini-ferramenta → FAQ → CTA.

## Decisões de copy

- Botão contextual ("Criar meu link de barbearia") com a frase do D1 logo abaixo: "Comece grátis, sem cartão".
- Lembrete sempre "por e-mail"; WhatsApp aparece como o lugar onde o link é colado.
- Sem prova social até existir prova real (o componente existe e fica desligado).
- Psicologia sem sessão fixa (o produto não tem recorrência); manicure sem frequência numérica.
