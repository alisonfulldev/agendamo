# Registro de decisões

Decisões tomadas durante a construção (prompts 2 a 41) sem aprovação prévia, conforme combinado.
Revise antes de aplicar no Supabase de produção.

## Geral

- **Bibliotecas novas**: `@electric-sql/pglite` (dev, testes de SQL sem Docker) e `qrcode` (QR do link da página e do Pix; gerar QR na mão é arriscado).
- **Testes de banco**: `supabase/tests/*.test.ts` rodam todas as migrations num Postgres em memória (PGlite) com um stub do Supabase (papéis `anon`/`authenticated`/`service_role`, `auth.uid()`, grants padrão, `pg_cron`/`pg_net` falsos). Rodam no `npm test`.

## Prompt 2 — Núcleo

- Todas as tabelas de negócio têm `business_id`, inclusive as de ligação (`professional_services`, `working_hours`, `appointment_services`…). Filhos referenciam pais por chave composta `(id, business_id)`: o banco impede misturar dados de negócios diferentes, mesmo com bug no código.
- Status e tipos como `text` + `check` (não `enum`), para evoluir sem `alter type`.
- `appointment_resources.active` espelha o status do agendamento (trigger), porque a restrição de exclusão não enxerga outra tabela.
- Telefone de cliente guardado só com dígitos e DDI (`5511999998888`); único por negócio (base da deduplicação).
- `appointment_services` guarda nome, duração e preço copiados no momento do agendamento.
- Negócios são criados e excluídos só pelo servidor (service role); não há policy de insert/delete para usuários.
- Staff: vê e edita só agendamentos e bloqueios do próprio profissional, e só clientes que já tiveram agendamento com ele. Não edita serviços, expediente nem o negócio.
- Leitura pública só por funções `security definer`: `get_public_business`, `get_public_services`, `get_public_professionals`, `slug_is_available`.
- Funções de acesso (`private.is_member`, `is_owner`, `can_access_professional`…) ficam no schema `private`, que a API do Supabase não expõe.

## Prompt 3 — Demais tabelas

- `page_stats_daily` guarda as contagens em `jsonb` (`counts` e `outside_hours`, por tipo de evento) em vez de uma coluna por tipo.
- `portal_events` ganhou `business_id` (opcional) para o Radar de demanda saber quantas vezes cada negócio apareceu.
- `calendar_connections` guarda tokens cifrados (AES-256-GCM com `ENCRYPTION_KEY`) e não tem policy: só o servidor lê.
- `subscriptions` tem um registro por negócio; o plano em vigor continua em `businesses.plan`, atualizado pelo webhook.
- `abandoned_bookings.consent` tem `check (consent)`: sem consentimento a linha nem entra.
- `referrals.referred_customer_id` é único: cada cliente só pode ser indicada uma vez.

## Prompt 4 — Motor de horários

- O intervalo (buffer) de cada serviço conta como ocupado e precisa caber no expediente. O `ends_at` gravado inclui o intervalo.
- A grade conta a partir do início de cada faixa de expediente (09:00, 09:30… e 13:00, 13:30… depois do almoço).
- Recursos ficam ocupados só durante o passo do combo que precisa deles (duração + intervalo do passo).
- "Qualquer profissional": o sorteio pega quem tem menos agendamentos no dia; empate vai para quem vem antes na ordem.

## Prompt 5 — Autenticação

- E-mails de autenticação saem pelo Resend com a marca do domínio: o servidor gera o link com `auth.admin.generateLink` (não manda e-mail pelo Supabase) e o link aponta para `/auth/confirm` no domínio que a pessoa está usando.
  **No Supabase**: desligar os e-mails padrão não é necessário, mas configure "Site URL" e "Redirect URLs" com os domínios das marcas.
- Cadastro com e-mail já existente responde igual ao normal (não revela se a conta existe) e manda um e-mail "você já tem conta".
- Limite de chamadas em tabela do Postgres (`rate_limits` + `check_rate_limit`), sem Redis. Chaves são HMAC (nunca IP ou e-mail em texto).
- A sessão só é renovada no proxy em rotas que precisam (painel, admin, telas de login, APIs autenticadas). A página pública não paga esse custo.
- Em produção, se a dona entrar pelo domínio de outra marca, o painel redireciona para o domínio da marca do negócio. Em desenvolvimento o painel usa as cores da marca do negócio.
- Links para fora (e-mails, QR) usam o domínio da marca só em produção (`VERCEL_ENV=production`). Em desenvolvimento e prévias usam `NEXT_PUBLIC_APP_URL` + `?brand=<marca>`.
- O topo do e-mail mostra o nome da marca em texto (Gmail e outros bloqueiam SVG).

## Prompt 6 — Cadastro guiado

- O negócio é criado por uma função SQL (`create_business`) que grava tudo ou nada. Só o servidor pode chamá-la.
- Um usuário cria um único negócio. O profissional padrão recebe o nome do negócio.
- Expediente padrão sugerido: segunda a sexta 09–12 e 13–18, sábado 09–13.
- Fuso fixo America/Sao_Paulo no cadastro (editável em Configurações).

## Prompt 7 — Imagens

- Upload assinado com `Content-Type`, `Content-Length` e `Cache-Control` dentro da assinatura: o navegador não consegue trocar tamanho ou tipo.
- Depois do envio, o servidor confere o tamanho real no R2 (`HeadObject`) antes de registrar.
- O limite de fotos conta só as visíveis. Fotos ocultas pelo fim do teste não ocupam vaga, mas também não voltam sem vaga.
- Se a compressão passar de 300 KB, o navegador tenta qualidades menores (0,65 → 0,45) antes de desistir.
- **R2**: o bucket precisa de CORS liberando `PUT` dos domínios das marcas (e localhost em dev).

## Prompt 8 — Minha página e Configurações

- Novos serviços ficam disponíveis para todos os profissionais ativos (ajuste por profissional na tela Equipe).
- Alerta de contraste da cor principal: avisa se o texto do botão fica abaixo de 4,5:1 ou a cor sobre o fundo abaixo de 3:1.
- Trocar o slug é permitido, com aviso de que links antigos quebram.
- Prévia no celular é um iframe da própria página pública (`?preview=1`), só em telas largas.
- Cache da página pública: `unstable_cache` com chave marca + slug e tag por negócio; toda edição expira na hora (`revalidateTag(tag, { expire: 0 })`).

## Prompts 9–11 — Página pública, pedido de horário, rastreamento

- Página pública lida por uma função SQL única (`get_public_page`), sem chave Pix nem dados de clientes (só o primeiro nome na avaliação). Plano e teste são lidos sem cache a cada visita (mudar a data do teste no banco muda a página na hora).
- Negócio de outra marca acessado por um domínio errado é redirecionado para o domínio da marca dele.
- Cor principal personalizada usa `data-theme-scope` para recalcular os tokens só naquela página.
- Pedido de horário: anti-spam com campo isca, tempo mínimo de 2,5 s, limite por IP e telefone.
- Rastreamento: cookie próprio `lv_sid` (30 min), aviso de cookies informativo (cookie anônimo, sem opt-in), `sendBeacon`. Não grava IP. A dona logada e robôs não contam.

## Prompts 12–14 — Estatísticas e avisos

- `pg_cron` + `pg_net` chamam `/api/cron/*` com `Authorization: Bearer CRON_SECRET`; URL e segredo ficam em `private.cron_settings` (preenchida no setup, nunca na migration). 10 tarefas, todas idempotentes (consolidação recalcula do zero; e-mails usam `notification_log`).
- "Fora do horário" = cliques no botão principal com nenhum profissional trabalhando naquela hora (fuso do negócio).
- Avisos para dona/equipe: e-mail + push, com preferências por tipo; staff só recebe o que é do próprio profissional.
- Descadastro: link assinado (HMAC); a página só confirma com clique (robôs de e-mail não descadastram); o cabeçalho `List-Unsubscribe-Post` faz o descadastro de um clique.

## Prompts 15–18 — Planos, agenda, chat, comunicação

- `getPlanFeatures` é a única regra de plano (servidor). Fim do teste ou da assinatura: `apply_plan_limits` oculta fotos e desativa profissionais acima do limite, sem apagar nada.
- Agendamento gravado por função SQL atômica (`book_appointment`): agendamento + serviços + reservas de recurso, e o uso do cupom na mesma transação. Conflito → mensagem amigável.
- O horário escolhido precisa estar entre os que o motor oferece (não basta não colidir no banco).
- Status: cliente acima do limite de faltas ou confirmação manual → `pending`; serviço com sinal e chave Pix configurada → `awaiting_deposit`; senão `confirmed`.
- Combo: o preço do combo é dividido proporcionalmente entre os serviços gravados. Sinal: valores fixos somam; porcentagem incide sobre o preço cobrado de cada serviço; nunca passa do total.
- Consentimento para "quase agendou" = caixa de novidades marcada.
- Remarcação pela cliente e cancelamento respeitam a antecedência mínima; depois disso, só pelo WhatsApp.
- Arrastar na agenda (dia, colunas por profissional) chama a mesma remarcação validada no servidor e avisa a cliente.

## Prompts 19–23 — Cobrança, PWA, vendas, admin, testes

- Asaas (endpoints conferidos na documentação): cliente exige CPF/CNPJ; assinatura com `billingType: UNDEFINED` (cliente escolhe cartão ou Pix na fatura do Asaas). Cada adicional é uma assinatura separada.
- Webhook idempotente pela tabela `webhook_events`; se o processamento falha, o id é liberado para o Asaas reenviar.
- Cancelar mantém o plano até o fim do período pago; atraso de mais de 5 dias volta ao Grátis (cron diário).
- Cupom da plataforma reduz o valor da assinatura enquanto ela existir.
- **Preço do Domínio próprio: R$ 19/mês provisório** (o prompt não define).
- Troca de plano com assinatura ativa vale na hora; o novo valor entra na próxima cobrança.
- PWA: manifest e ícones gerados por rota com a marca do domínio.
- Admin: "ativado" = negócio com pelo menos uma visita registrada.

## Prompts 24–33 — Equipe, clientes, vendas

- Convite de staff: conta nova recebe link de convite (cria a senha); conta existente só é vinculada.
- Importação de clientes: deduplica por telefone; cliente existente só ganha campos vazios; nunca mexe no opt-in.
- Exclusão de dados de cliente final (pedido de LGPD) apaga cliente, agendamentos dela e registros com o mesmo e-mail.
- Pacotes: venda registrada no painel (pagamento fora da plataforma), uma sessão descontada ao concluir.
- Lista de espera: ao cancelar, todos os inscritos daquele dia e serviço recebem o e-mail; quem agendar primeiro leva (o chat e o banco garantem um único agendamento).
- Avaliação: link de uso único (o token é "gasto" de forma atômica); convite para o Google só após nota 4 ou 5.
- Indicação: só cliente nova com código válido; vale após o primeiro atendimento concluído; uma por cliente indicada.
- Artes: QR do Pix/página gerado como PNG (fundo branco da própria imagem, sem cor fixa no código).

## Prompts 34–41 — Integrações, portal, segurança

- Google Agenda: escopos `calendar.events` e `calendar.freebusy`; tokens cifrados (AES-256-GCM); livre/ocupado com cache de 2 min (marca na chave); eventos criados pelo sistema são "transparentes" para não bloquear duas vezes.
- Embed: `embed.js` por domínio de marca; `postMessage` validado pela origem; Esc dentro do iframe também fecha.
- Portal: perfil completo = foto, bio com 30+ caracteres, cidade e 3+ serviços com preço. Listagem indexável com 3+ negócios completos; o resto `noindex` e fora do sitemap. Perfis incompletos em `/[slug]` também ficam `noindex`.
- Radar: "busca" = sessão que viu a listagem; horários de pico em horário de São Paulo; nada abaixo de 5 é exibido.
- Domínio próprio: endpoints da Vercel conferidos na documentação; o proxy guarda a consulta do domínio em memória por 1 minuto; os valores de DNS mostrados vêm da própria API da Vercel.
- Segurança: CSP, HSTS e X-Frame-Options aplicados no proxy; só `/<slug>/agendar` pode ser embutido. CSP usa `'unsafe-inline'` para scripts (o Next precisa sem um esquema de nonce).

## Relatório da revisão final (Prompt 41)

**Verificado automaticamente**: lint, typecheck, Prettier, build de produção, 460+ testes unitários e de banco (RLS, conflitos, cupons, estatísticas, portal, cron) e E2E sem banco (marcas, cache entre marcas, embed, cabeçalhos).

**Não verificado (depende dos serviços externos, a configurar no final)**:

- As migrations nunca rodaram num Supabase real (só no PGlite com stub). Pontos de atenção: criação das extensões `pg_cron`/`pg_net`, schema `extensions` do `unaccent`, permissões padrão do Supabase.
- Os E2E de fluxo completo (`e2e/full/`) estão escritos mas nunca rodaram.
- Asaas, Google, Vercel (domínios), Resend, R2 e web push: código conforme a documentação, nunca chamados de verdade.
- Plugin WordPress não testado num WordPress real.
- Nota do Lighthouse (página pública e de vendas) não medida.

**Limitações conhecidas (não bloqueiam o lançamento)**:

- Crons percorrem os negócios em sequência; com muitos negócios, convém paginar ou dividir por lotes.
- Tela do admin carrega até 1.000 negócios e conta eventos da semana na aplicação.
- Nomes, domínios, logos (placeholders em SVG) e textos das 5 marcas são provisórios.
- Termos de Uso e Política de Privacidade são textos-base para revisão jurídica.

**Itens do CLAUDE.md**: todas as 14 regras críticas têm implementação. Nenhuma pendência crítica conhecida além da verificação com os serviços reais.

## Modo demonstração local (2026-10-03)

- Pedido da dona: testar telas e fluxos sem banco nem integrações antes de configurar os serviços externos.
- `npm run dev:demo` liga `DEMO_MODE=1` (desligado sempre que `NODE_ENV=production`). Nenhum comportamento muda fora do modo demo.
- Banco: PGlite (já usado nos testes, sem dependência nova) persistido em `.demo-data/pg`, com o mesmo stub do Supabase dos testes (agora em `src/lib/demo/supabase-stub.ts`). Migrations novas são aplicadas sozinhas no próximo início.
- `src/lib/demo/query.ts` emula o subconjunto do supabase-js usado no projeto (filtros, embeds por chave estrangeira, count, single, insert/upsert/update/delete, rpc). Cada chamada roda como `anon`/`authenticated`/`service_role`, então a RLS vale como no Supabase.
- Login: cookie assinado `lv_demo_session`; senhas em texto puro só no banco local da demo.
- E-mails vão para `.demo-data/emails.json` (caixa na página `/demo`); uploads usam URL assinada local (`/api/demo/upload`) e são servidos por `/api/demo/files`.
- Bugs reais achados pela varredura de telas e corrigidos para todos os modos: prévia do celular em `/painel/pagina` bloqueada pelo CSP (a página `/<slug>` agora aceita ser embutida pela mesma origem: `frame-ancestors 'self'`, `X-Frame-Options: SAMEORIGIN`) e `<div>` dentro de `<p>` no cabeçalho do painel.
- Nova migration `20261003000001_reserve_demo_slug.sql`: reserva o slug `demo` (a rota `/demo` existe no app).

## Chat no estilo de app de mensagens (2026-10-03)

- Pedido da dona: "Agendar" e "Pedir horário" parecidos com WhatsApp, respeitando direitos autorais.
- `src/components/chat/chat-ui.tsx`: cabeçalho com foto e nome do negócio, fundo com padrão de desenhos próprio (máscara SVG tingida com a cor da marca), balões com "rabinho", horário e ✓✓, digitando…, respostas em botões e barra de digitar com botão redondo de enviar.
- Sem logo, nome, cores (verde) ou papel de parede do WhatsApp: tudo nas cores da marca. O nome "WhatsApp" só aparece nos links wa.me ("Avisar pelo WhatsApp"), uso referencial.
- "Pedir horário" (Grátis) deixou de ser formulário e virou conversa (`request-chat.tsx`), com a mesma ação de servidor, validação e proteção contra robôs.
- Janela em tela cheia no celular e modal de 720px no computador; o modal de sites externos usa a mesma conversa.

## Pedir horário com horário de verdade (2026-10-03)

- Decisão da dona: no Grátis a cliente escolhe um horário livre real (mesmo motor do chat), mas fica como pedido; a dona confirma em Pedidos. O Pro mantém a confirmação automática, lembretes, sinal Pix etc.
- Migration `20261003000002_request_slot.sql`: `booking_requests` ganha `preferred_starts_at`, `professional_id` e `appointment_id`.
- O servidor confere que o horário ainda está livre ao gravar o pedido; horários já pedidos em pedidos abertos não são oferecidos de novo.
- "Confirmar" cria o agendamento (`createBooking`, origem manual) e manda o e-mail de confirmação se houver e-mail; o pedido continua na lista com "Enviar confirmação pelo WhatsApp" (wa.me com mensagem pronta, enviado pela dona — sem API). "Recusar" descarta e avisa por e-mail.
- Modo demo: limites de chamadas ×20 (todo mundo é localhost) e migrations novas aplicadas sem reiniciar.

## Chat primeiro + perfil estilo app de mensagens (2026-10-03)

- Decisão da dona: o chat é o produto; o link do negócio (`/<slug>`) abre direto na conversa ("Agendar" no Pro/Equipe, "Pedir horário" no Grátis). Vai na bio do Instagram e nos botões do site próprio.
- Tocar na foto/nome no topo do chat abre "Dados do perfil" (como as informações do contato): foto, nome, bairro/cidade, nota, atalhos (agendar, como chegar, Instagram), sobre, serviços e preços, fotos, avaliações, endereço e links.
- `/<slug>/perfil` mostra o mesmo perfil sozinho: é a URL canônica e indexável (rule 12), usada no sitemap e no portal.
- Sem botão de WhatsApp na página: o WhatsApp só aparece dentro do chat quando não há horário e no painel da dona.
- "Feito com [marca]" (Grátis) aparece embaixo da barra de digitar e no fim do perfil.
- Próximo: oferta de site profissional (R$ 200) por popups periódicos no painel e e-mails de proposta (só com opt-in e descadastro, rule 10).

## Plano único + financeiro (2026-10-03)

- Decisões da dona: 30 dias grátis automáticos; depois R$ 29/mês ou R$ 240/ano (R$ 20/mês, economia de R$ 108 exibida); 1 profissional incluso + R$ 9/mês (R$ 90/ano) por extra. Fim do Grátis e do Equipe. CLAUDE.md atualizado.
- Fim do teste sem assinatura: chat → WhatsApp da dona com o pedido pronto (nada gravado/reservado); painel só com Assinatura e Conta (bloqueio em `requireBusiness`/`requireOwner`, por página e ação, para valer também depois de redirecionamentos de ações e navegação no cliente). Nada é ocultado ou apagado.
- Pix de R$ 1 cobrado da cliente final foi descartado: viola a regra 11 (plataforma nunca recebe de cliente final) e a taxa do Pix consome o valor.
- Migration `20261003000003_single_plan_and_finance.sql`: `businesses.professional_seats`, `subscriptions.extra_professionals`, `apply_professional_seats`, trigger que inicia o teste na criação, `photo_limit` = 60, tabela `finance_entries` (RLS só dona) e trigger que lança a receita quando o atendimento vira "concluído" (sai se mudar de status). Receitas antigas foram geradas pela migration.
- Financeiro (`/painel/financeiro`): mês a mês, receitas, custos, lucro, receitas por forma de pagamento, custos por categoria, lançamentos com cliente, forma de pagamento editável, exclusão só de lançamentos manuais (auditada) e exportação CSV.
- Estatísticas passaram a contar conversas iniciadas e cliques nos links do perfil (não existem mais botões de WhatsApp/principal na página).
- "Pedidos" saiu do menu (sem Grátis não há pedidos novos); a tela continua para consultar pedidos antigos.

## Landing nova, saudação neutra e e-mail opcional (2026-10-03)

- Landing de cada marca refeita para o "chat primeiro" e o plano único: topo com celular e chat animado (mensagens da própria marca, em loop; parado se a pessoa prefere menos movimento), "Chega de…" (3 dores por marca), como funciona, "Tudo isso num plano só", preço (mensal/anual com economia), depoimentos (marcados como Exemplo), perguntas frequentes e chamada final. Textos das 5 marcas em `src/brands/*` (`sales.pains`, `sales.demo.customerName/dayLabel/time`).
- Saudação do chat: "Você está na agenda de {business}" — o nome do negócio pode ser o nome da pessoa; nada de "da/do {business}". Mensagens que a dona envia usam "Aqui é {business}".
- E-mail da cliente opcional no chat: pergunta diz "(é opcional)", botão "Prefiro não informar"; a frase "enviamos por e-mail" (`chatMessages.emailNote`) só aparece quando há e-mail.
- Resumo do chat: mostra a resposta da cliente ("Confirmar agendamento"), não cita profissional quando não houve escolha e omite "valor R$ 0,00" em serviço sem preço (perfil mostra "Sob consulta").
- "Salvar na minha agenda": botões Google Agenda (link pré-preenchido) e Calendário do iPhone (.ics).

## Checkout próprio da mensalidade e preparação para produção (2026-10-03)

- A dona paga dentro do painel; o Asaas só processa por trás (endpoints conferidos em docs.asaas.com):
  - Pix: assinatura `billingType: PIX`, QR code da cobrança (`GET /payments/{id}/pixQrCode`) mostrado no painel; a tela atualiza sozinha quando o webhook confirma.
  - Cartão: tokenização (`POST /creditCard/tokenizeCreditCard`, com o IP da dona) e assinatura `CREDIT_CARD` com o token. Os dados do cartão passam pelo servidor uma vez, nunca são gravados nem registrados; ficam só os 4 últimos dígitos e a bandeira (migration `20261004000001`).
  - Trocar forma de pagamento: `PUT /subscriptions/{id}` (billingType) e `PUT /subscriptions/{id}/creditCard` (cartão novo, sem cobrar).
  - Clientes criados com `notificationDisabled: true`; a renovação por Pix gera o nosso e-mail com o link para o painel (evento `PAYMENT_CREATED`). Adicionais são pagos por Pix.
- Migration `20261004000002_explicit_api_grants.sql`: permissões explícitas das tabelas para os papéis da API (projetos novos do Supabase podem não expor tabelas novas). Seguro porque todas as tabelas públicas têm RLS (teste `supabase/tests/security.test.ts`).
- Marcas com domínio provisório (`*.example.com`) usam o endereço do app com `?brand=` nos links, também em produção, até o domínio real entrar no arquivo da marca.
- `docs/SETUP.md` (guia curto para Supabase, Resend, Vercel e Asaas) e `npm run check:setup` (confere chaves e conexões sem exibi-las).
- Modo demo: Asaas simulado (cartão terminado em 0000 é recusado; `/demo` confirma pagamentos); nunca liga em produção.

## E-mails: remetente "Agendamo" e sem marketing (2026-10-04)

- Remetente de todos os e-mails: `Agendamo <nao-responda@topsitebr.com.br>` (`RESEND_FROM` na forma completa), pelo domínio já verificado no Resend.
- Sem e-mail marketing: saíram os e-mails "Hora de voltar" e "Aniversário" (rota `/api/cron/marketing` removida; migration `20261004100000` desliga a tarefa). Ficam só os necessários: cadastro, troca de senha, confirmações/lembretes/cancelamentos de agendamento, lista de espera pedida pela cliente, convite de equipe, mensalidade e avisos operacionais para a dona.
- A caixinha do chat passou a ser só a autorização para a dona chamar no WhatsApp se a cliente não terminar ("Quase agendaram"); ninguém é inscrito em novidades.

## Agendamo: página inicial genérica e páginas por nicho (2026-10-04)

- Nome do produto: **Agendamo** em todo lugar (site, painel, chat, e-mails). Os nichos continuam como configurações em `src/brands` (tema, termos, mensagens, serviços sugeridos), todos com o nome "Agendamo".
- `/`: página genérica (configuração `src/brands/platform.ts`, fora de `BRANDS`): o que o sistema faz, o chat, cartões dos 5 nichos, preço e perguntas. "Testar grátis" leva a `/comecar` (escolha do nicho).
- `/beleza`, `/barbearia`, `/estetica`, `/psicologia`, `/fisioterapia`: a landing do nicho (componente `SalesPage`), com o tema aplicado só na página; o cadastro sai em `/cadastro?brand=<nicho>`.
- Endereços reservados (migration `20261004110000`) para nenhum negócio usar esses links. Sitemap lista a home e as páginas de nicho.
- Se um nicho ganhar domínio próprio no futuro, a home daquele domínio mostra a landing do nicho.

## SEO: preços públicos, "grátis" e marca no domínio compartilhado (2026-10-16)

- D1: "grátis" só onde é verdade, com o limite ao lado da promessa ("Grátis no modo WhatsApp. Lembretes automáticos e agenda completa no plano pago."). Botão: "Comece grátis, sem cartão"; "Teste grátis" só com prazo; nunca "para sempre". `/precos` volta a existir com os dois níveis (textos em `src/content/pricing.ts`, valores de `src/lib/plans.ts`). Isso substitui a decisão de 2026-10-13 de não mostrar preços nas páginas públicas. `SoftwareApplication` ganha as duas `Offer` só na Fase 2, refletindo `/precos`.
- D2: no domínio compartilhado, `/<slug>`, `/<slug>/perfil` e `/<slug>/agendar` abrem na marca do negócio, sem redirect para `?brand=` (componente `BrandScope`). Só o domínio próprio de outra marca redireciona (308). O selo leva à página do nicho (`nicheHubUrl`).
- D3: páginas novas sob prefixos: `/recursos/`, `/ferramentas/`, `/comparar/`, `/agendamento/`, `/ajuda/`, `/precos`. Nichos e subpáginas de nicho ficam no primeiro nível.
- D4: diretório `/{nicho}/{cidade}` indexável a partir de 3 perfis elegíveis (configurável); `/explorar` fica como busca; 301 1:1 das URLs com equivalente depois de checar o Search Console; bairro só depois de a cidade mostrar tração.
- Metadata de páginas públicas sai de `pageMetadata` (`src/lib/seo/metadata.ts`); sitemap virou índice (`/sitemap.xml` → `/sitemap/<seção>.xml`) com `lastmod` real (`src/content/site-pages.ts`); robots em `src/lib/seo/robots.ts`, com rastreadores de IA liberados por padrão.

## Fotos: qualquer foto, aviso no painel e lembrete por e-mail (2026-10-23)

- Fotos de resolução máxima (Samsung 50 a 200 MP) e imagens de tela cheia baixadas falhavam ao abrir no navegador. A leitura agora tenta em etapas (imagem inteira → já reduzida a 2400 px → leitor de `<img>`), aceita fotos sem tipo pela extensão e originais de até 50 MB (só o WebP comprimido de até 300 KB é enviado). Mensagens de erro dizem o que fazer (HEIC: compartilhar como JPG ou enviar um print). HEIC/HEIF fora do Safari: biblioteca `heic-to` (libheif, LGPL-3.0, versão `csp` sem eval), aprovada em 2026-10-23, carregada só quando a foto é HEIC e o navegador não a abre; reconhece HEIC também pelo conteúdo do arquivo. A CSP passou a permitir `blob:` em `worker-src` (o decodificador roda num worker).
- Falhas no registro da foto no servidor passam a ir para o log com o motivo (sem dado pessoal nem imagem).
- Aviso no painel (`src/app/painel/photo-prompt.tsx`) quando falta foto de perfil ou capa: prévia do perfil e envio ali mesmo; não aparece no tour, em "Meu perfil" nem no modo de espera; "Agora não" esconde por 3 dias.
- E-mail e push únicos (tipo "Dicas para completar o perfil", desligável em Notificações) para donas sem foto de perfil ou capa, a partir do dia seguinte ao cadastro; as contas existentes recebem uma vez. Enviado pela tarefa diária das 8h30 (`daily-alert`).

## Fotos: conversão no servidor quando o celular não consegue (2026-10-23)

- Mesmo com as etapas no navegador, o Chrome do Android ainda falhava em algumas fotos (inclusive prints). Pesquisa: `createImageBitmap(Blob)` é instável no Chrome móvel; os apps grandes (Facebook etc.) processam a foto no servidor. Decisão definitiva, aprovada pela dona do produto:
  1. No navegador, a leitura começa pelo mesmo leitor que mostra a foto na galeria (`<img>` + canvas), depois `createImageBitmap` e, para HEIC, `heic-to`.
  2. Se o celular não conseguir (`PrepareError`), o original (até 50 MB) é enviado direto ao R2 por URL assinada numa chave privada `incoming/<negócio>/<id>`; a ação `processOriginalAction` lê em memória, converte com `sharp` (já instalado, sem custo novo) para o mesmo WebP de até 300 KB, apaga o original e salva como qualquer envio. Exceção à regra 7 registrada no CLAUDE.md.
  3. O log registra só a etapa que falhou ("photo converted on the server" / "photo fallback failed"), sem dados da foto. A limpeza diária apaga o que sobrar em `incoming/` com mais de 1 dia.
- Cloudflare Images foi descartado (pago). O editor de recorte fica para depois, se ainda houver falhas.


## Preço do Completo: R$ 23,90/mês ou R$ 19,90/mês no anual (2026-10-23)

- Mensal baixou de R$ 29,90 para R$ 23,90; anual de R$ 298,80 para R$ 238,80 (R$ 19,90/mês). Profissional extra continua R$ 9/mês (R$ 90/ano).
- Assinantes existentes passam ao valor novo a partir da próxima cobrança (needs_reprice, tarefa diária do cron trial), como na mudança de 2026-10-12.

## Assinatura só por Pix, com Pix Automático (2026-10-28)

- Decisão da dona do produto: sem cartão (valor baixo; o Pix custa R$ 1,99 por pagamento no Asaas, contra 2,99% + R$ 0,49 no cartão) e sem opção de "pagar à mão" (quem pode escolher esquece de pagar). Havia uma assinatura ativa, por Pix; nenhuma por cartão.
- Asaas, Pix Automático jornada 3 (docs.asaas.com/docs/pix-automatico-implementacao): `POST /v3/pix/automatic/authorizations` com `paymentCreationMode: SUBSCRIPTION`, `value` fixo, `frequency` MONTHLY/ANNUALLY, `startDate` = fim do período pago, `retryPolicy: ALLOW_THREE_IN_SEVEN_DAYS` e `immediateQrCode` (QR da primeira mensalidade, 24 h). Ativa depois do pagamento e da confirmação do banco; então o Asaas cria a assinatura (`subscriptionId`) que gera e debita as próximas cobranças. Cancelar: `DELETE /v3/pix/automatic/authorizations/{id}`. Exige conta PJ aprovada, com chave Pix e CNPJ ativo há 6 meses (conta habilitada em 2026-10-28).
- Webhooks tratados: `PIX_AUTOMATIC_RECURRING_AUTHORIZATION_ACTIVATED | REFUSED | CANCELLED | EXPIRED` (objeto `authorization`) e `PIX_AUTOMATIC_RECURRING_PAYMENT_INSTRUCTION_REFUSED` (objeto `paymentInstruction`, aviso por e-mail e push). O primeiro pagamento vale uma vez (`pix_automatic_first_payment_id`), venha antes o evento de pagamento (achado pelo cliente Asaas) ou a ativação.
- Socorro: sem débito automático (autorização recusada depois de paga, cancelada no banco, expirada, ou assinatura do Asaas encerrada sem a dona cancelar), o plano segue com uma assinatura Pix comum a partir do fim do período, e a dona é avisada. A mensalidade em aberto no painel gera o QR de uma nova autorização (paga e reativa); o QR comum da cobrança só aparece com a autorização ativa (débito recusado) ou se o Asaas falhar.
- Valor novo (profissionais, ciclo, reajuste por needs_reprice) com Pix Automático ativo: a autorização é cancelada e a próxima mensalidade é paga pelo QR, que autoriza o valor novo (o pagador só autorizou o valor antigo).
- Migration `20261028100000_pix_automatic`: `pix_automatic_id`, `pix_automatic_status`, `pix_automatic_first_payment_id` e `value_cents` (valor recorrente com cupom) em `subscriptions`. `billing_type` continua aceitando `credit_card` só pelo histórico.
- Removidos: tokenização e troca de cartão, formulário de cartão no painel e o teste e2e do cartão.

## Landing em blocos de cor, inspirada na Linktree (2026-10-28)

- Home e páginas de nicho passam a ter seções em blocos de cor de largura total (`.lp-lime`, `.lp-deep`, `.lp-brand`, `.lp-soft` em globals.css), títulos grandes em Bricolage Grotesque 800 (`.lp-title`, fonte só da landing, pré-carregada para o H1), centralizados no celular, botões em pílula e cabeçalho flutuante em pílula. Inspiração no estilo da Linktree sem copiar marca, fonte (Link Sans é exclusiva) nem paleta: roxo do MeetChat + verde-limão.
- Cores só nos arquivos de marca: `theme.highlight` (limão, padrão `LANDING_HIGHLIGHT` em platform.ts) e `theme.deep` (MeetChat: #1B1464); sem `deep`, o bloco escuro é a cor da marca misturada com a tinta mais escura do tema (funciona nos temas escuros, como barbearia e tatuagem). O título sobre a cor da marca usa o limão só quando contrasta (≥ 3:1).
- SEO intocado: mesmos textos, H1/H2/H3, links, metadados e JSON-LD (comparados com produção em /, /beleza e /barbearia antes do deploy). Mockups e o celular animado mantêm as cores do tema (`.lp-plain`).
- Ajuste no mesmo dia: o verde-limão é só da MeetChat (home e chat de criação antes de virar o chat do negócio). Cada página de nicho usa só a própria paleta: o topo na cor do nicho e os blocos num tom claro e num tom escuro derivados dela (`landingColors` em theme.ts). O modelo antigo de nicho (`HomePage`, nichos sem texto próprio em landing.ts) ganhou os mesmos blocos. Chat de criação, entrar/cadastro e painel continuam como antes; o chat de criação começa em roxo + limão e muda para a cor do negócio.

## Chat de ajuda no painel (2026-11-03)

- Botão "Ajuda" flutuante em todas as telas do painel (dona e equipe), sem IA. Abre só com a saudação (a pessoa escreve primeiro). Busca com sinônimos (mudar = trocar = alterar…; cliente = paciente = aluno), radical das palavras (mudo, mudei, mudar), peso maior para o assunto que para o verbo, "Você quis dizer…?" quando duas respostas empatam, e respostas a oi, obrigado e frases vagas. Respostas prontas em `src/content/support.ts` (pergunta, palavras-chave, resposta, tela e alvo), busca no navegador (`src/lib/support-search.ts`: sem acento, ignora palavras vazias, tolera um erro de digitação, exige que boa parte das palavras combine). "Ir para lá" abre a tela e destaca a seção (pelo título) ou o campo (pelo name) com `.help-flash`.
- Sugestões conforme a tela; a equipe só vê respostas marcadas `staff`; no modo de espera, telas fechadas levam à assinatura. Sem resposta: sugestões e "Falar com o suporte" (mailto para o e-mail de suporte, com a pergunta e a tela).
- Sem medição por enquanto (a lista de dúvidas sem resposta exigiria tabela nova; fica para depois, com aprovação).

## Oferta "Site + Agenda" (2026-11-04)

- Segundo produto, vendido de forma consultiva pelo link `/?criar=1&oferta=site`: site feito à mão em até 48 horas úteis + agenda online (mesmos recursos do Completo). Preços em `SITE_OFFER` (`src/lib/plans.ts`): R$ 97 no primeiro Pix (criação + 1º mês), R$ 39/mês pelo Pix Automático, extras a R$ 9/mês, só mensal, cupom aceito (não vale para o domínio), sem fidelidade. Domínio .com.br opcional a R$ 91/ano: 1º ano no primeiro Pix e, depois, uma assinatura anual separada no Asaas (`addons.custom_domain`, ciclo anual).
- O chat de criação vende sozinho nesse link (`SITE_SALES` em `src/content/creation.ts`): pitch do site → da agenda (com a simulação) → preço → dúvidas → domínio → cadastro normal, sem teste e sem "grátis". "Falar com o consultor" em todas as etapas abre o WhatsApp de vendas (wa.me, sem API; cliques contados como `cta_click` em `/oferta-site/consultor`). Exceção aprovada à regra de contato só por e-mail.
- Conta criada com `businesses.offer = 'site'`, sem teste (o modo de espera abre o pagamento) e um `site_orders` (awaiting_payment → paid → delivered). No primeiro pagamento: plano liberado, prazo de 48 h úteis (dias úteis, sem feriados), cobrança anual do domínio e e-mail aos admins com o que criar. Lembrete único por e-mail e push a quem não pagar em 24 h (tarefa diária). Admin › Sites a criar lista pedidos, prazos (em vermelho quando faltam menos de 6 h) e "Marcar como entregue" (audit_log).
- Se o Pix Automático falhar na assinatura da oferta, não há o Pix comum de reserva (ele não cobra um primeiro valor diferente): a pessoa tenta de novo. Reajustes de preço do Completo (needs_reprice) nunca mexem nessa assinatura.
- Negócios sem hora marcada (lanchonete, loja) não são vendidos pelo MeetChat: vão para a TopSite (site com botão de pedido pelo WhatsApp).
- Mudança no mesmo dia, para vender mais: **R$ 49/mês, sem taxa de criação e sem fidelidade** (o primeiro Pix é a 1ª mensalidade, + R$ 91 se pedir domínio). `setupCents` saiu de `SITE_OFFER`; `siteFirstPrice` = mensalidade + domínio. Fidelidade com contrato e negativação foi discutida e ficou de fora por enquanto. Outros setores (orçamento, pedidos) são vendidos sem o sistema, pelo consultor.

## Dois planos: Completo e Site + Agenda (2026-11-05)

- Substitui a oferta de 2026-11-04 (site feito à mão, link `?oferta=site`, chat de vendas, `site_orders`, admin › Sites a criar): tudo isso saiu do código. As colunas e a tabela da migration `20261104100000_site_offer` ficam no banco só como histórico (migration aplicada não se edita).
- **Completo** (chat + agenda): R$ 23,90/mês ou R$ 238,80/ano. **Site + Agenda**: o mesmo + um site por negócio em `/<slug>/site`, R$ 49/mês ou R$ 490/ano (`PLAN_PRICES.site`, `SITE_PRICE_TEXT`, `TIER_NAME` em `src/lib/plans.ts`). Extras a R$ 9/mês nos dois. Sem domínio próprio.
- Banco (migration `20261105100000_site_plan`): `businesses.plan` continua dizendo se paga ("free"/"complete"); `businesses.plan_tier` ("complete"/"site") diz qual plano. `subscriptions.tier` e `next_tier`. Tabela `site_settings` (cores, título, subtítulo, botão, foto do topo, ordem e visibilidade das seções), leitura por membros (RLS), escrita só pelo servidor.
- `getPlanFeatures().site` = teste ativo ou assinante do Site + Agenda. O teste de 14 dias dá o site a todos (inclusive quem já estava no teste). No fim do teste a dona escolhe o plano na tela de assinatura (Site + Agenda vem marcado).
- Troca de plano pelo painel: subir para o Site + Agenda liga o site na hora (valor novo a partir da próxima cobrança); descer para o Completo mantém o site até o fim do período pago (`next_tier`, aplicado em `activateBusinessPlan` no próximo pagamento).
- Site (`src/components/business-site/site-view.tsx`, `src/app/[slug]/site/page.tsx`): modelo único no estilo da landing (blocos de cor), montado com os dados do negócio e na cor dele; todo "Agendar" abre o chat (`/<slug>`). Sem site (Completo ou modo de espera), o endereço leva ao chat (307). SEO: título "Nome: Nicho em Cidade | Agende online", LocalBusiness + breadcrumb, indexável com o mesmo critério do perfil (`isIndexable`). Com site no ar, ele é a URL canônica (o perfil aponta para ele), entra no sitemap "sites" no lugar do perfil e vai ao IndexNow.
- Etapas seguintes: editor "Meu site" no painel, dois links no Início, e-mails do teste com os dois planos; popup e e-mail único de novidade (categoria "Novidades e dicas", com descadastro); páginas `/site-e-agenda` por nicho e `/precos` com os dois planos.
- Editor "Meu site" (`/painel/site`, menu do painel): cores (principal e destaque, com "voltar à automática"), foto do topo (tipo de imagem `site_hero`, mesmo envio direto ao R2, só com o site), título, subtítulo e texto do botão (em branco = texto automático), seções com mostrar/esconder e ordem, prévia do site no ar e lista do que falta para o Google (mesmas regras do perfil). Salvar exige o site no plano (regra 6), valida com zod, limpa o cache da página e avisa o IndexNow. Sem o site, a tela mostra o convite para o Site + Agenda. Início: cartão "Seu site" com copiar, QR próprio e "Editar meu site".

## Incentivo ao uso durante o teste (2026-11-05)

- Diagnóstico (19 cadastros em 30 dias): 89% abriram o link, 37% puseram foto, 16% voltaram ao painel depois do 1º dia, nenhum ativou aviso no celular (as chaves VAPID não estavam na Vercel), nenhum assinou.
- Popup do app no painel (`src/app/painel/app-prompt.tsx`): no celular sem o app, "Instale o app" (botão no Android, passo a passo no iPhone); com o app ou no computador, "Ative os avisos". "Agora não" esconde por 3 dias; nunca durante o tutorial; um popup por visita (`prompt-slot.ts`, dividido com o da foto).
- Bônus de link: +7 dias de teste por link (`src/lib/trial-bonus.ts`). Links próprios `/<slug>?de=bio` (bio do Instagram) e `?de=saudacao` (saudação do WhatsApp Business), no cartão "Ganhe até +14 dias" do Início. O bônus sai na primeira visita de cliente por cada link (mesmos filtros das estatísticas: sem robôs, sem a dona ou a equipe logadas), só com o teste ativo, uma vez cada (notification_log `bonus_bio` / `bonus_saudacao`), com audit_log `plan.trial_extended` e aviso por e-mail e push. Não é prova absoluta (o Instagram e o WhatsApp não deixam ler a bio), mas exige um cliente de verdade tocando no link.
- Dicas durante o teste (`src/lib/notifications/usage-tips.ts`, no cron diário): dia 1 link na bio e na saudação (se < 5 visitas), dia 2 app e avisos (se sem push), dia 3 perfil e site completos (o que falta), dia 5 mandar o link para 5 clientes com texto pronto (se sem agendamento pelo chat), dia 7 primeira semana (visitas só com 5 ou mais, regra 5). Cada uma uma vez, só se ainda útil, no máximo uma por dia por negócio (quem já está no teste pega a partir de onde está), nunca nos últimos 5 dias (ficam os avisos do teste). Categoria "Novidades e dicas" (tipo `news`), ligada por padrão, com descadastro de um clique (`/avisos/desligar`, `/api/notifications/off`, List-Unsubscribe) e interruptor em Notificações; "Dicas para completar o perfil" ganhou o mesmo link.
- Slug "avisos" reservado (migration `20261105110000_reserve_avisos`).

## Painel mais limpo (2026-11-05)

- Menu de 17 itens para 7 seções (`PANEL_SECTIONS` em `src/app/painel/nav.ts`): Início, Agenda, Clientes, Financeiro (Financeiro, Sinais pelo Pix), Minha página (Meu perfil, Meu site), Vender mais (Vendas, Avaliações, Estatísticas, Radar) e Ajustes (Configurações, Equipe, Integrações, Notificações, Assinatura, Conta). As telas de uma seção viram abas no topo (`SectionTabs`). No celular, a barra de baixo tem Início, Agenda, Clientes e Mais (as outras seções, agrupadas). Nenhuma rota mudou.
- Início em quatro blocos: "Precisa de você" (Pix para conferir, agendamentos para aprovar, pedidos de horário novos, sinal pela metade; só aparece se houver algo), o dia (agendamentos de hoje e horários livres para postar), "Próximo passo" (um passo por vez, com progresso: perfil, avisos no celular, links da bio e da saudação com +7 dias no teste, fotos, QR code; some quando tudo está feito) e "Seus links" (chat e site). Saíram do Início o guia de instalar o app (agora é o popup) e os cartões separados de bônus e de primeiros passos.
- No máximo um popup por dia no painel (`prompt-slot.ts`): o primeiro que aparecer no dia (app ou foto) ocupa a vez.

## Venda pelo WhatsApp e modelo Elegante (2026-11-06)

- Venda no x1, não pública (nada aparece no site): Admin › Vendas › Nova venda. Com nome do negócio, ramo, nome, e-mail, WhatsApp e CPF/CNPJ do cliente, o sistema cria a conta (sem senha) e o negócio montado para o ramo, sem teste grátis (fica em modo de espera até pagar), com o modelo de site escolhido, e gera o Pix da 1ª mensalidade pelo Pix Automático (`subscribePlan`; o QR autoriza as próximas). Tabela `assisted_sales` (só o servidor; token do link de pagamento, plano, valor, cupom, Pix atual, status). `src/lib/sales/assisted.ts`.
- Página de pagamento `/pagar/<token>` (fora do Google; token aleatório de 192 bits): valor, QR, copia e cola, o que está incluso e o aviso de que pagar aceita os Termos e autoriza o Pix Automático; atualiza sozinha e mostra "Pagamento confirmado". Pix vencido (24 h): "Gerar novo Pix" na tela da venda (mesmo plano e cupom; o cliente do Asaas é reaproveitado, sem pedir o CPF de novo).
- Pago: `activateBusinessPlan` chama `completeAssistedSale` (`src/lib/sales/assisted-paid.ts`): venda paga, aceite dos termos registrado (via pagamento), e-mail "Sua conta está pronta" ao cliente (entra por código) e "Venda paga" aos admins.
- Roteiro de mensagens (Admin › Vendas › Roteiro, `src/content/sales-script.ts`): 1 boas-vindas, 2 os dois modelos (links dos exemplos do ramo), 3 como funciona (preços de plans.ts), 4 fechamento; 5 (Pix) e 6 (depois do pagamento) prontas na tela de cada venda, com "Abrir WhatsApp" (wa.me comum, aberto pelo vendedor).
- Sites de exemplo `/exemplo/<ramo>` e `?modelo=elegante` (fora do Google, sem link no site): negócio fictício do ramo (`src/content/site-examples.ts`), faixa "Site de exemplo" que troca o modelo, e "Agendar" abrindo a simulação da conversa de criação (nada é gravado). `SHOWCASE_SLUGS` permite trocar o fictício por uma conta vitrine real, com fotos.
- Modelo de site "Elegante" (`elegant-view.tsx`): fundo claro, foto grande, títulos em Fraunces, linhas finas; mesmos dados, seções e edições do "Vibrante". `site_settings.template`; escolha em Meu site e na Nova venda.
- Slugs reservados: exemplo, pagar.
- Próximas partes aprovadas: domínio próprio (R$ 91/ano, no nome do cliente, registro manual no Registro.br e conexão automática na Vercel) e site personalizado (R$ 197 com o 1º mês, ou R$ 148 para assinantes; briefing na plataforma, até 5 dias úteis, 1 rodada de ajustes).

## Domínio próprio na venda pelo WhatsApp (2026-11-06)

- R$ 91/ano (`PLAN_PRICES.domainYearly`), registrado no nome e CPF do cliente. Na Nova venda: "Domínio próprio" + consulta de disponibilidade no RDAP público do Registro.br (404 = livre). O 1º Pix soma a 1ª mensalidade e o 1º ano (`subscribePlan.firstExtraCents`; sem o Pix Automático, a venda com domínio não cai no Pix comum: tenta de novo).
- Estados em `custom_domains.status`: awaiting_payment → awaiting_registration (pago; `expires_at` = +1 ano; cria a cobrança anual do domínio no Asaas, Pix comum, vencendo 10 dias antes) → connecting (o admin registrou e tocou em "Conectar": domínio e www com 308 adicionados ao projeto na Vercel) → live (DNS certo e verificado; e-mail e push "Seu site está no ar", IndexNow).
- Admin › Vendas › Domínios: passo a passo (link do Registro.br, 2 entradas de DNS para copiar, "Já registrei: conectar", "Verificar agora", "Renovei (+1 ano)"). Tarefa diária (`runDomainJobs` no cron daily-alert): confere os domínios em conexão, lembra os admins 30 dias antes de vencer no Registro.br e manda ao cliente o Pix da renovação 10 dias antes (o Asaas está com notificações desligadas).
- No ar: a raiz do domínio mostra o site (o proxy reescreve "/" para /<slug>/site); /<slug>/site no MeetChat redireciona (308) para o domínio, que vira o canônico; o sitemap "sites" deixa de listar esse site; o painel mostra o domínio no lugar do endereço do MeetChat.
- Variáveis na Vercel (Production): VERCEL_API_TOKEN (secret), VERCEL_PROJECT_ID e VERCEL_TEAM_ID.

## Site personalizado (2026-11-06)

- R$ 197 com o 1º mês do Site + Agenda (criação R$ 148 + R$ 49, `PLAN_PRICES.customSite`) para quem ainda não assina; R$ 148 avulso para assinante do Site + Agenda; assinante do Completo muda de plano antes. Entrega em até 5 dias úteis (seg a sex, sem feriados) contados quando há pagamento e briefing; 1 rodada de ajustes.
- Tabela `custom_site_orders` (um pedido aberto por negócio; RLS de leitura para membros, escrita só pelo servidor). `payment_kind`: "with_plan" (pago no 1º pagamento da assinatura: `subscribePlan.firstExtraCents`; `markPlanOrderPaid` em `activateBusinessPlan`, só se o Pix daquele pedido foi o gerado; um checkout normal depois apaga esse Pix) ou "single" (Pix avulso no Asaas, `createPixPayment`; o webhook de pagamento sem assinatura marca pago por `payment_id`).
- Painel: Meu site › "Quer um site com a sua cara?" → /painel/site/personalizado: briefing (estilo, cores, referências, destaques, frase, sobre, diferenciais, público, até 12 fotos pelo envio de imagens, tipo `briefing`, observações; salva rascunho), pagamento, "em produção" com a data, entregue, 1 pedido de ajuste. E-mails e push à dona na entrega e no ajuste; e-mail aos admins quando entra em produção e quando pedem ajuste.
- Admin › Sites personalizados: lista com o prazo (vermelho com menos de 1 dia), briefing em texto com "Copiar briefing" (com o id do negócio) para colar no chat do Claude Code, fotos, "marcar como entregue", "concluir" e "cancelar" (audit_log `admin.custom_site`).
- O site feito vira um modelo exclusivo no código: `src/components/business-site/custom/` registrado em `CUSTOM_SITES` pelo id do negócio; usa os mesmos dados do sistema (serviços, preços, avaliações) e o "Agendar" abre o chat.
- Na venda pelo WhatsApp, "Site personalizado" soma R$ 148 ao primeiro Pix e cria o pedido; o cliente responde o briefing no painel.

## Anúncio do Site + Agenda para quem já usava (2026-11-06)

- Para contas criadas antes de 2026-11-05 (`ANNOUNCEMENT_CUTOFF`), textos em `src/content/site-plan-announcement.ts` por situação: em teste ("seu teste agora vem com um site"), assinante do Completo ("tenha também o seu site", mudar de plano) e modo de espera ("site + agenda: assine e tudo volta").
- Popup no painel (`news-prompt.tsx`) para teste e Completo, uma vez por aparelho, nunca no tutorial, com prioridade na vez do dia.
- E-mail e push únicos na categoria "Novidades e dicas" (descadastro de um clique; quem desligou não recebe), disparados pelo admin em Admin › Anúncio (prévia dos textos, contagem por grupo, confirmação; lotes de 40; uma vez por conta via notification_log `announce_site_plan`; audit_log `admin.announcement_sent`).
