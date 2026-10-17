# Auditoria de design e copy (2026-10-17)

## O que existe

- **Home e páginas de nicho** usam o mesmo componente (`src/components/home/home-page.tsx`): hero com celular animado (5 s, uma vez), chips de nicho, "Como funciona" em 3 passos numerados, intro do nicho, 6 cards de ganhos (ícone + frase), lembrete, FAQ, CTA final, lista de 31 nichos e rodapé.
- **Tema**: todas as cores vêm de `--brand-*` (arquivos de `src/brands`), com teste que proíbe cor literal fora deles. Sem modo escuro. A plataforma (home) usa índigo `#4338CA` e Poppins + Inter; cada nicho tem paleta e fontes próprias (barbearia: fundo escuro, dourado, Oswald).
- **Páginas novas do SEO** (`/agendamento`, `/ferramentas`, `/comparar`, `/recursos`, `/ajuda`, subpáginas): layout de artigo simples, corretas e rápidas, mas visualmente neutras.
- **Performance**: tudo renderizado no servidor; só o celular do hero e a conversa de criação são JavaScript (a conversa carrega sob demanda).

## O que está fraco e por quê

| Problema                                                                                                                                                                | Por quê importa                                                                              |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Visual de template SaaS: grid de 6 cards ícone + frase, 3 passos numerados em círculos, painel de CTA com gradiente.                                                    | Parece qualquer software; não transmite o produto (uma conversa).                            |
| O produto aparece uma vez (celular do hero) e some.                                                                                                                     | O visitante não vê o lembrete, a agenda nem o link na bio, que são o motivo de pagar.        |
| Copy genérica e repetida entre nichos: os nichos trocam a intro e o FAQ, mas "Como funciona", ganhos e lembrete são o mesmo texto com "cliente" trocado por "paciente". | Ninguém sente "isso sou eu"; o portão de qualidade mostra 38 a 59% de semelhança entre hubs. |
| Benefícios em forma de recurso ("Agenda 24h", "Aviso no seu celular").                                                                                                  | Recurso não vende; o resultado (dormir e acordar com horário marcado) vende.                 |
| Nenhuma objeção respondida fora do FAQ ("não sei mexer", "meu cliente não vai usar", "já uso o WhatsApp").                                                              | Essas dúvidas travam o clique no CTA.                                                        |
| A dor não tem porta de entrada: quem chega cansado de responder mensagem e quem chega com cliente que falta veem a mesma página.                                        | Cada intenção já tem um guia (`/agendamento/*`), mas a home não leva até eles.               |
| Rodapé com 31 nichos em lista corrida.                                                                                                                                  | Difícil de escanear; não organiza por intenção.                                              |
| Tipografia sem personalidade (Poppins em tudo) e escala de títulos pequena no celular.                                                                                  | Pouca hierarquia; o título não "segura" a primeira tela.                                     |
| Cor da plataforma (índigo) desconectada da marca pedida (`#A8466D`).                                                                                                    | Identidade fria, de software corporativo.                                                    |
| Movimento quase inexistente fora do hero, e o celular toca uma vez e para.                                                                                              | O produto parece estático.                                                                   |
| e2e da home (`e2e/home.spec.ts`) desatualizado (espera zero links para `/precos`).                                                                                      | Precisa ser refeito junto com a home.                                                        |

## O que preservar

- SEO técnico: metadata (`pageMetadata`), JSON-LD (Organization, WebSite, SoftwareApplication com as duas ofertas, FAQPage do FAQ visível, Breadcrumb), um único H1, conteúdo no HTML.
- Fluxo de criação: botões abrem `?criar=1` por cima (`OpenCreationLink` + `LazyCreationChat`), barra de CTA fixa no celular.
- Regra 14: nenhuma cor literal fora dos arquivos de marca; cada nicho com sua paleta.
- D1: "grátis" com o limite ao lado; valores só em `/precos`.

## Fatos do produto que limitam a copy

- Lembrete e confirmação ao cliente: **e-mail**, um dia antes, só para quem informou o e-mail (opcional). Nada é enviado pelo WhatsApp.
- Sem recorrência (sessão semanal fixa não existe).
- Modo grátis = modo WhatsApp: o pedido chega pelo WhatsApp e nada é reservado sozinho.
- Sem prova social real ainda: nenhum depoimento, número de clientes ou avaliação agregada da plataforma. Blocos de prova ficam desligados.
