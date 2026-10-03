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
