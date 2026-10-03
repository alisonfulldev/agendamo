# Lively — Prompts do Projeto

## Como usar

Use os prompts na ordem, um por vez, no Claude Code. Só passe ao próximo quando os critérios de aceite estiverem cumpridos e você tiver testado manualmente. Faça um commit ao final de cada prompt aprovado. Se o Claude Code mexer em algo fora do prompt, responda apenas: "Volte ao escopo do prompt atual".

Sem Docker: crie dois projetos no Supabase (desenvolvimento e produção). Aplique as migrations no de desenvolvimento com supabase link + supabase db push, e no de produção só depois de testado. Use as prévias da Vercel para testar cada etapa.

Git: o repositório deve ficar só na pasta do projeto (nunca na pasta do usuário inteira), em um repositório privado no GitHub conectado à Vercel. O .gitignore deve ignorar .env* (exceto .env.example) e node_modules.

## FASE 0 — Fundação

### PROMPT 0 — CLAUDE.md

```
Crie o arquivo CLAUDE.md na raiz com o conteúdo abaixo (sem incluir esta linha de instrução; o arquivo deve começar em "# Projeto") e não faça mais nada:

# Projeto: Lively — agenda e link de bio multimarcas

## Produto
Página tipo "link na bio" + agenda + ferramentas de venda para negócios de serviço com horário marcado.
Vendido como várias MARCAS, uma por nicho (beleza, barbearia, estética, psicologia, fisioterapia, personal, tatuagem...), cada uma com domínio, nome, cores e textos próprios, usando o MESMO sistema.

Planos (iguais em todas as marcas):
- Grátis (para sempre): página com foto, capa, bio, links, WhatsApp (wa.me), serviços com preço, até 9 fotos, avaliações, botão "Pedir horário" (pedido manual), estatísticas, perfil no portal. Rodapé "Feito com [marca]".
- Pro (R$ 19/mês ou anual com 2 meses grátis; 30 dias grátis sem cartão, uma vez por negócio): 1 profissional, chat de agendamento com horários livres, agenda, lembretes, até 30 fotos, sem rodapé, ferramentas de venda, sinal por Pix, pacotes e combos, Google Agenda, modal para sites externos.
- Equipe (R$ 49/mês ou anual): tudo do Pro + até 5 profissionais, "qualquer profissional", recursos compartilhados (sala/maca), permissões de equipe, relatórios por profissional, até 60 fotos.
- Adicionais: Destaque no portal (R$ 49/mês por cidade) e Domínio próprio.
- Cupons de desconto na assinatura.

Canais:
- Avisos para a dona e equipe: SOMENTE e-mail e notificação web (push). Nunca WhatsApp, nunca SMS.
- Clientes finais: e-mail transacional sempre; e-mail de marketing só com opt-in e descadastro.
- WhatsApp apenas como link comum wa.me aberto manualmente pela pessoa. Sem API.

## Stack fixa (não trocar, não adicionar bibliotecas sem perguntar)
Next.js App Router + TypeScript strict; Supabase na nuvem (Postgres, Auth, RLS, pg_cron, pg_net);
Supabase CLI apenas para migrations remotas (sem Docker, sem supabase start);
Cloudflare R2 para imagens via @aws-sdk/client-s3 e @aws-sdk/s3-request-presigner;
Tailwind + shadcn/ui; zod; date-fns + date-fns-tz; Resend; web-push; Vitest; Playwright; Sentry; deploy na Vercel.

## Idioma
Código, tabelas e arquivos em inglês. Interface em português do Brasil.

## Regras críticas
1. Multi-inquilino: toda tabela de negócio tem business_id e RLS. Um negócio nunca acessa dados de outro.
2. Sem horário duplicado: EXCLUDE USING gist por profissional (e por recurso) com tstzrange para status ativos. Tratar conflito com mensagem amigável.
3. Datas em UTC (timestamptz). Cada business tem timezone (padrão America/Sao_Paulo).
4. Horário só é oferecido se duração + intervalo couberem inteiros, fora de pausas, bloqueios, agendamentos, recursos ocupados e compromissos do Google Agenda. Grade 15/30/60. Respeitar antecedência mínima e limite futuro.
5. Estatísticas sem identificar visitantes: só contagens, horários e id de sessão anônimo. Ignorar dona logada e robôs. Números agregados abaixo de 5 nunca são exibidos.
6. Recursos de plano verificados no servidor (nunca só na interface) por getPlanFeatures.
7. Imagens comprimidas no navegador (WebP via canvas nativo) e enviadas direto ao R2 por URL assinada gerada no servidor. Nunca passar arquivo pelo servidor Next. Limites por plano validados no servidor.
8. Tarefas agendadas: pg_cron + pg_net chamando rotas /api/cron/* protegidas por CRON_SECRET. Todas idempotentes.
9. Toda entrada validada com zod no servidor. Rotas públicas e de autenticação com limite de chamadas.
10. E-mails de marketing só com opt-in e descadastro com um clique.
11. Pix do sinal é pago direto ao profissional. A plataforma nunca recebe dinheiro de cliente final.
12. Páginas do portal só indexáveis com conteúdo mínimo; caso contrário, noindex e fora do sitemap.
13. Registrar em audit_log ações sensíveis (plano, exclusões, permissões, ações de administrador).
14. Multimarcas: um único projeto Next.js e um único banco atendem várias marcas, cada uma com domínio próprio. O middleware identifica a marca pelo cabeçalho Host e carrega a configuração de src/brands. Nunca duplicar código por marca: diferenças ficam só na configuração da marca. Todo negócio pertence a uma marca (brand_key) e sua página, painel e e-mails usam essa marca.

## Como trabalhar
- Uma tarefa por vez, exatamente como pedida. Não adiantar etapas.
- Antes de mexer em banco, autenticação, imagens, pagamentos, domínios ou integrações externas: mostre o plano e espere aprovação.
- Não invente APIs; se não tiver certeza, diga.
- Nunca edite migration aplicada; crie outra.
- Não rode comandos de git; o versionamento é feito manualmente.
- Ao terminar: lint, typecheck e testes passando; liste arquivos alterados e pendências.
- Se algo estiver ambíguo, pergunte.
```

### PROMPT 1 — Base do projeto

```
Leia o CLAUDE.md.
Objetivo: base do projeto, sem telas de produto.
Faça:
- Next.js App Router, TypeScript strict, Tailwind, shadcn/ui, ESLint, Prettier.
- Vitest com teste de exemplo; Playwright com teste que abre a home.
- src/lib/supabase com clients server, browser e admin (service role só no servidor).
- src/lib/env.ts validando variáveis de ambiente com zod (as de integrações futuras como opcionais por enquanto).
- .env.example com: Supabase (URL, anon, service role), R2 (account id, access key, secret, bucket, URL pública), Resend (API key e RESEND_FROM para desenvolvimento), VAPID (public, private e VAPID_SUBJECT no formato mailto:), CRON_SECRET, Asaas (chave, token do webhook e ASAAS_ENV sandbox|production), Google OAuth (client id e secret), Vercel (token e project id para domínios), Sentry DSN, ADMIN_EMAILS, DEFAULT_BRAND.
- .gitignore ignorando .env* (exceto .env.example) e node_modules.
- Supabase CLI só para migrations; README explicando supabase link com o projeto remoto de desenvolvimento e supabase db push. Nada de Docker.
- Sentry configurado.
Não faça: tabelas, telas, autenticação, comandos de git.
Aceite: npm run dev funciona; lint, typecheck, Vitest e Playwright passam.
```

### PROMPT 1B — Multimarcas

```
Leia o CLAUDE.md (regra 14). Mostre o plano antes.
Objetivo: o mesmo projeto atender várias marcas, cada uma com domínio, nome, cores e textos próprios.
Faça:
- Pasta src/brands com um arquivo por marca (começar com beauty e barber, nomes provisórios) e um tipo BrandConfig com:
  key, name, domains (produção), logo, favicon, defaultSegment, theme (primary, background, surface, text, muted, button, accent, fontFamily, radius),
  sales (título, subtítulo, benefícios, como funciona, perguntas frequentes, depoimentos), suggestedServices, terms (customer, service, appointment),
  chatMessages (textos do chat, ver Prompt 17), emailFrom (nome e endereço), socialLinks.
- Validar todos os arquivos de marca com zod na inicialização.
- getBrandByHost(host): mapeia o domínio para a marca; em localhost e nas prévias da Vercel, permitir escolher a marca por ?brand= gravado em cookie; sem correspondência, usar DEFAULT_BRAND.
- Middleware que lê o Host, resolve a marca e repassa em cabeçalho interno x-brand, sem alterar a URL visível.
- getCurrentBrand() para componentes de servidor e BrandProvider no layout raiz aplicando o tema como variáveis CSS no <html>, mais título, favicon e metadados.
- Todos os componentes usam as variáveis CSS do tema (nenhuma cor fixa no código).
- Rotas iguais para todas as marcas, no domínio da marca:
  /  página de vendas | /entrar e /cadastro | /painel/... | /[slug] página pública do negócio
- README: como adicionar uma marca nova (arquivo em src/brands, domínio no projeto da Vercel, domínio no Resend).
Não faça: telas de produto além de uma home de demonstração por marca.
Aceite: com ?brand=beauty e ?brand=barber a mesma home aparece com nome, cores e textos diferentes; teste unitário cobre getBrandByHost; mudar de marca não deixa resquício de cache da outra.
```

## FASE 1 — Banco de dados

### PROMPT 2 — Núcleo da agenda

```
Leia o CLAUDE.md. Mostre o plano antes de criar a migration.
Objetivo: tabelas do núcleo.
Faça (migration nova):
- businesses: name, slug (único global, minúsculo, sem acento, 3 a 40 caracteres), brand_key, segment, timezone, plan (free|pro|team), trial_started_at, trial_ends_at, slot_interval_minutes (15|30|60, padrão 30), min_notice_minutes (padrão 120), max_days_ahead (padrão 60), booking_confirmation (auto|manual), no_show_limit, portal_opt_out, created_at.
- reserved_slugs e validação do slug contra ela.
- members: user_id, business_id, role (owner|staff), professional_id (para staff).
- professionals: business_id, name, photo_key, active, position.
- services: business_id, name, description, duration_minutes, buffer_minutes, price_cents, deposit_type (none|fixed|percent), deposit_value, return_after_days, active, position.
- professional_services: professional_id, service_id, duration_override, price_override.
- resources: business_id, name. service_resources: service_id, resource_id.
- working_hours: professional_id, weekday (0-6), start_time, end_time (várias faixas por dia).
- time_off: professional_id, starts_at, ends_at, reason.
- customers: business_id, name, email, phone, birthdate, notes, marketing_opt_in, blocked, no_show_count, referral_code (único), referred_by_customer_id, created_at.
- appointments: business_id, professional_id, customer_id, starts_at, ends_at, status (confirmed|pending|awaiting_deposit|cancelled|completed|no_show), source (chat|manual), cancel_token, deposit_cents, deposit_status (none|waiting|informed|confirmed), deposit_expires_at, coupon_code, referral_code, package_id, google_event_id, created_at.
- appointment_services: appointment_id, service_id, duration_minutes, price_cents (cópia no momento).
- appointment_resources: appointment_id, resource_id, starts_at, ends_at.
- Extensão btree_gist; restrição de exclusão em appointments (por professional_id) e em appointment_resources (por resource_id) para status confirmed, pending e awaiting_deposit.
- Índices nas chaves estrangeiras e em (business_id, starts_at).
- RLS via members: owner acessa tudo do negócio; staff só a agenda e os clientes do próprio profissional. Leitura pública apenas por funções seguras (negócio por slug, serviços e profissionais ativos).
- seed.sql: 1 negócio de cada marca, 2 profissionais, 1 recurso, 3 serviços, expediente de terça a sábado com almoço.
Não faça: telas.
Aceite: migration aplicada no projeto de desenvolvimento; teste SQL provando conflito por profissional e por recurso; usuário de outro negócio não lê nem altera; staff não vê agenda de outro profissional.
```

### PROMPT 3 — Tabelas de página, vendas, portal e suporte

```
Leia o CLAUDE.md. Mostre o plano antes.
Objetivo: demais tabelas.
Faça (migration nova):
- page_settings: business_id, bio, avatar_key, cover_key, primary_color_override, whatsapp_number, instagram_url, address, city, neighborhood, show_prices, google_review_url, pix_key, pix_receiver_name, deposit_deadline_minutes.
- page_links: business_id, label, url, position, active.
- page_photos: business_id, object_key, width, height, size_bytes, position, hidden, created_at.
- booking_requests: business_id, service_id, customer_name, phone, email, preferred_date, preferred_period (morning|afternoon|evening), message, status (new|contacted|done|discarded), created_at.
- abandoned_bookings: business_id, service_ids, date, slot, customer_name, phone, email, consent, status (open|resolved), created_at.
- waitlist_entries: business_id, service_id, professional_id, date, customer_name, phone, email, notified_at, status.
- reviews: business_id, appointment_id (único), customer_id, rating 1-5, comment, reply, hidden, created_at; review_tokens com uso único.
- referrals: business_id, referrer_customer_id, referred_customer_id, appointment_id, status (pending|valid), reward_applied.
- packages: business_id, service_id, name, sessions, price_cents, active. customer_packages: customer_id, package_id, sessions_left, sold_at.
- combos: business_id, name, price_cents, active; combo_services: combo_id, service_id, position.
- business_coupons: business_id, code, discount_type, discount_value, valid_until, max_uses, uses.
- page_events: business_id, type (view|click_whatsapp|click_instagram|click_link|click_book|request_started|request_sent|booking_started|booking_confirmed), session_id, occurred_at, outside_hours, meta jsonb. Sem dados pessoais.
- page_stats_daily: business_id, date, contagem por tipo e fora do horário.
- portal_events: brand_key, city, neighborhood, service_slug, type (search|view|click), session_id, occurred_at. Sem dados pessoais.
- portal_stats_monthly: brand_key, city, neighborhood, service_slug, month, contagens.
- portal_featured: business_id, city, active_until.
- custom_domains: business_id, domain, verified, created_at.
- calendar_connections: professional_id, provider, access_token cifrado, refresh_token cifrado, calendar_id, created_at.
- push_subscriptions: user_id, endpoint, p256dh, auth.
- notification_preferences: user_id, tipo, email, push.
- notification_log: business_id, type, reference, sent_at (índice único por business, type, reference).
- email_unsubscribes: email, business_id, created_at.
- subscriptions: business_id, provider, provider_customer_id, provider_subscription_id, plan, billing_cycle (monthly|yearly), addons jsonb, status, current_period_end.
- platform_coupons: code, discount_percent, valid_until, max_uses, uses, brand_key (opcional).
- audit_log: business_id, user_id, action, details jsonb, created_at.
- Funções SQL: photo_limit(plan) (free 9, pro 30, team 60) e professional_limit(plan) (free 1, pro 1, team 5).
- RLS: tabelas com dados de visitantes (events, booking_requests, abandoned_bookings, waitlist) só aceitam inserção pelo servidor; leitura só pelos membros do negócio.
Não faça: telas.
Aceite: migration aplicada; RLS testada.
```

## FASE 2 — Lógica

### PROMPT 4 — Motor de horários

```
Leia o CLAUDE.md.
Objetivo: funções puras em src/lib/availability.
Faça:
- getAvailableSlots(input) recebendo: faixas de expediente do dia, bloqueios, agendamentos existentes, compromissos externos (Google), lista de serviços em sequência (combo), duração e buffer de cada um, recursos exigidos e sua ocupação, grade, antecedência mínima, limite futuro, timezone e "agora".
- Um início só é válido se o bloco inteiro couber e se todos os recursos exigidos estiverem livres no período.
- getAvailableSlotsAnyProfessional (união de quem faz todos os serviços escolhidos) e pickProfessional (round_robin pela quantidade de agendamentos do dia).
- getAvailableDays para os próximos N dias.
- Retornar horários em UTC e formatados no fuso do negócio.
- Testes ESCRITOS ANTES cobrindo: conflito, almoço, fim do expediente, combo de dois serviços, buffer, antecedência, limite futuro, bloqueio de dia inteiro e parcial, dia sem expediente, grade 15/30/60, fuso America/Sao_Paulo, recurso ocupado com profissional livre, compromisso externo, "agora" no meio do dia.
Não faça: acesso ao banco.
Aceite: todos os testes passam.
```

## FASE 3 — Conta e configuração

### PROMPT 5 — Autenticação

```
Leia o CLAUDE.md. Mostre o plano antes.
Objetivo: login e conta, com a cara da marca do domínio.
Faça:
- Cadastro, login, confirmação de e-mail, recuperação de senha e sair (Supabase Auth), com limite de tentativas.
- Telas e e-mails de autenticação usando nome, logo e cores da marca atual; links dos e-mails apontando para o domínio da marca.
- Middleware protegendo /painel.
- Página de conta: troca de senha e "Excluir minha conta" (confirma digitando o slug; apaga negócio, dados e imagens do R2; registra em audit_log).
Não faça: cadastro do negócio.
Aceite: fluxo completo nas duas marcas; painel inacessível deslogado.
```

### PROMPT 6 — Cadastro guiado do negócio

```
Leia o CLAUDE.md.
Objetivo: primeiro acesso cria o negócio.
Faça, em passos com barra de progresso:
1. Segmento já sugerido pela marca do domínio (editável).
2. Nome e slug (sugestão automática, validação em tempo real, reservados bloqueados).
3. WhatsApp (máscara brasileira), Instagram, endereço, cidade e bairro.
4. Serviços (sugestões da marca, editáveis; pelo menos 1).
5. Expediente semanal com pausas.
- Cria business com brand_key da marca atual (plan free), member owner, professional padrão, page_settings e working_hours.
- Ao final: link da página e QR code para baixar.
Não faça: fotos, agenda.
Aceite: cadastro feito no domínio da barbearia cria negócio com brand_key barber e serviços de barbearia.
```

### PROMPT 7 — Imagens no R2

```
Leia o CLAUDE.md. Mostre o plano antes.
Objetivo: upload de avatar, capa, fotos e foto de profissional.
Faça:
- Compressão no navegador com canvas nativo: avatar e profissional 400x400, capa até 1200 px de largura, fotos até 800 px; WebP qualidade 0.75; rejeitar original acima de 15 MB.
- POST /api/uploads/sign: valida sessão, tipo, tamanho final (máx. 300 KB) e photo_limit do plano; URL assinada de PUT no R2 com chave businesses/{business_id}/{tipo}/{uuid}.webp e validade curta.
- Registrar em page_photos, page_settings ou professionals após o upload.
- Excluir remove o objeto do R2. Reordenar fotos arrastando.
- URL pública pelo domínio do R2 com cache longo.
Não faça: passar arquivo pelo servidor Next; otimização de imagem da Vercel nessas fotos.
Aceite: limite do plano respeitado no servidor; imagens rápidas pela URL pública.
```

### PROMPT 8 — Editor da página e configurações

```
Leia o CLAUDE.md.
Objetivo: telas "Minha página" e "Configurações".
Faça:
- Minha página: bio, links, serviços, combos, cor principal (padrão da marca, com opção de trocar e alerta de contraste ruim), mostrar preços, fotos, link de avaliação do Google, prévia em formato de celular.
- Configurações: dados do negócio, fuso, grade, antecedência, limite futuro, confirmação automática ou manual, limite de faltas, expediente e bloqueios, chave Pix e prazo do sinal, sair do portal.
- Copiar link e baixar QR code.
Aceite: alterações aparecem na página pública.
```

## FASE 4 — Página pública

### PROMPT 9 — Página pública

```
Leia o CLAUDE.md.
Objetivo: rota /[slug] estilo link na bio, rápida no celular.
Faça:
- Tema da marca do negócio, com a cor principal sobrescrita se a dona escolheu outra.
- Se o negócio for de outra marca que não a do domínio acessado, redirecionar para o domínio correto.
- Foto, capa, nome, bio, botão principal, links, WhatsApp (wa.me com mensagem padrão), Instagram, serviços e combos com preço, fotos (lazy loading), avaliações com média, endereço com link para mapas.
- Termos da interface conforme a marca/segmento.
- Renderização no servidor com cache por domínio e revalidação ao editar.
- SEO e Open Graph com nome e foto.
- Rodapé "Feito com [marca]" só no Grátis, com link para a página de vendas da marca.
- 404 amigável.
Não faça: chat, rastreamento.
Aceite: Lighthouse com nota alta no celular; negócio de barbearia acessado pelo domínio de beleza redireciona.
```

### PROMPT 10 — Pedir horário (Grátis)

```
Leia o CLAUDE.md.
Objetivo: no Grátis, o botão principal é "Pedir horário".
Faça:
- Formulário: serviço, dia preferido, período, nome, telefone, e-mail opcional, mensagem, consentimento.
- Ação de servidor com zod e limite de chamadas; grava em booking_requests.
- Sucesso com botão opcional "Avisar também pelo WhatsApp" (wa.me com resumo).
- Painel: lista de pedidos com status e botões para WhatsApp da cliente e ligar.
Aceite: pedido aparece no painel; spam bloqueado.
```

### PROMPT 11 — Rastreamento

```
Leia o CLAUDE.md.
Objetivo: eventos sem identificar visitantes.
Faça:
- Cookie próprio com id de sessão anônimo e aviso de cookies.
- POST /api/events: zod, limite por IP, ignora robôs e dona logada, calcula outside_hours pelo expediente no fuso do negócio.
- Envio com sendBeacon em visualização e cliques.
Aceite: um evento por ação; nenhum dado pessoal ou IP gravado.
```

## FASE 5 — Estatísticas e avisos

### PROMPT 12 — Tarefas agendadas e estatísticas

```
Leia o CLAUDE.md. Mostre o plano antes.
Objetivo: consolidar e exibir.
Faça:
- /api/cron/stats (idempotente) consolidando page_events em page_stats_daily.
- Migration com pg_cron + pg_net chamando as rotas de cron (esta e as futuras), com os horários documentados.
- Tela "Estatísticas": semana atual e anterior com visitas, cliques no WhatsApp, cliques no botão principal, pedidos, agendamentos e fora do horário.
Aceite: rodar duas vezes não duplica.
```

### PROMPT 13 — E-mails e notificação web

```
Leia o CLAUDE.md. Mostre o plano antes.
Objetivo: canais de aviso, sempre com a marca do negócio.
Faça:
- Resend com layout único de e-mail que recebe a marca (nome, logo, cores, remetente) e rodapé com descadastro nos e-mails de marketing.
- Push: service worker, botão "Ativar notificações", push_subscriptions, envio com web-push (usando VAPID_SUBJECT), remoção de inscrições inválidas.
- Aviso de novo pedido de horário: e-mail + push.
- Tela de preferências de notificação.
- Página pública de descadastro por link.
Aceite: e-mail de um negócio de barbearia sai com a marca de barbearia; push chega; instrução para iPhone instalar o painel antes de ativar push.
```

### PROMPT 14 — Resumo semanal e aviso diário

```
Leia o CLAUDE.md.
Objetivo: mostrar o valor do produto.
Faça:
- /api/cron/weekly-summary (segunda de manhã): números da semana; no Grátis, convite do teste de 30 dias com quantos quiseram agendar e quantos fora do horário; no Pro/Equipe, agendamentos feitos sozinhos.
- /api/cron/daily-alert: se houve cliques no botão principal fora do horário ontem, 1 aviso (e-mail + push) por dia, via notification_log.
- Texto: "pessoas quiseram agendar", nunca "você perdeu clientes".
Aceite: cada aviso sai uma vez por período.
```

## FASE 6 — Agenda e agendamento

### PROMPT 15 — Planos e teste de 30 dias

```
Leia o CLAUDE.md. Mostre o plano antes.
Objetivo: regras de plano no servidor.
Faça:
- getPlanFeatures(business) retornando os recursos de free, pro e team (teste ativo conta como pro).
- "Testar o Pro grátis por 30 dias" uma vez por negócio.
- Fim do teste sem assinatura: chat e agenda automática desligados; página, clientes e agendamentos mantidos; fotos acima do limite ficam hidden; profissionais além do limite ficam inativos.
- /api/cron/trial: e-mails 7 dias e 1 dia antes do fim.
Aceite: mudar a data do teste no banco muda página e painel na hora.
```

### PROMPT 16 — Agenda do painel

```
Leia o CLAUDE.md.
Objetivo: agenda para Pro e Equipe.
Faça:
- Visão de dia e semana responsiva.
- Agendamento manual (busca ou cria cliente, serviços ou combo), usando o motor e a restrição do banco.
- Bloquear horário, cancelar, remarcar (avisando a cliente por e-mail), marcar concluído e falta (incrementa no_show_count).
- Aprovar ou recusar pendentes.
- Sem plano: tela explicando o recurso com o botão de teste.
Aceite: nenhuma sobreposição; bloqueios somem da página.
```

### PROMPT 17 — Chat de agendamento

```
Leia o CLAUDE.md.
Objetivo: com Pro/Equipe, o botão principal vira "Agendar" e abre o chat com o tema da marca.
Faça:
- Tela cheia no celular e modal no computador, com mensagens e botões:
  serviço ou combo -> profissional ou "qualquer profissional" (só no Equipe) -> dia -> horário -> nome, telefone, e-mail, opt-in de novidades -> cupom opcional -> resumo -> confirmar.
- Textos do chat em src/brands (chatMessages), com variáveis {business}, {service}, {professional}, {date}, {time}, {price}, {customerName} e os termos da marca. Roteiro:
  1. Boas-vindas: "Oi! Aqui é da {business}. Qual {service} você quer agendar?" + botões com serviços e combos (nome, duração e preço).
  2. Profissional (só Equipe): "Com quem você prefere?" + fotos e nomes + "Qualquer profissional".
  3. Dia: "Ótimo! Qual dia fica melhor pra você?" + próximos dias com horário livre + "Ver mais dias".
  4. Horário: "Esses são os horários livres em {date}:" + botões. Sem horários: "Esse dia está cheio. Quer escolher outro dia ou entrar na lista de espera?"
  5. Dados: "Pra confirmar, me diz seu nome:", "Agora seu WhatsApp:", "E seu e-mail, pra te mandar a confirmação:" + caixa de opt-in "Quero receber novidades e lembretes de retorno".
  6. Cupom (opcional): "Tem cupom de desconto?" + "Tenho cupom" / "Não tenho".
  7. Resumo: "Confere pra mim: {service} com {professional}, {date} às {time}, valor R$ {price}" + "Confirmar agendamento" / "Alterar".
  8. Final confirmado: "Prontinho, {customerName}! Seu horário está confirmado. Te mandei a confirmação por e-mail."
     Final pendente: "Recebi seu pedido! {business} vai confirmar e você recebe o aviso por e-mail."
     Final aguardando sinal: "Pra garantir seu horário, pague o sinal de R$ {valor} pelo Pix abaixo até {prazo}."
     Botões finais: "Adicionar à agenda do celular" (.ics) e "Avisar pelo WhatsApp" (wa.me, opcional).
  9. Conflito: "Ops, esse horário acabou de ser ocupado. Veja os horários atualizados:"
  10. Cliente bloqueada: "No momento não conseguimos concluir seu agendamento por aqui. Fale direto com {business} pelo WhatsApp."
- Tom curto e amigável, no máximo um emoji por mensagem; cada marca pode ajustar o tom no próprio arquivo.
- Pequeno atraso de digitação (300 a 600 ms) entre mensagens do sistema, sem atrasar quem já está clicando.
- Voltar em cada passo; estado salvo ao recarregar; parâmetro ?ref= guardado para indicação.
- Cliente bloqueada recebe a mensagem neutra; cliente acima do limite de faltas entra como pending.
- Se o passo de contato for preenchido com consentimento e não houver confirmação, gravar em abandoned_bookings.
- Confirmação por ação de servidor: cria ou reaproveita cliente pelo telefone; status confirmed, pending ou awaiting_deposit; em conflito, mostra a mensagem de conflito e recarrega os horários.
- Dia sem horários: oferecer entrar na lista de espera.
- Eventos booking_started e booking_confirmed.
Aceite: dois navegadores no mesmo horário geram um único agendamento; textos mudam conforme a marca.
```

### PROMPT 18 — Confirmações, lembretes e cancelamento

```
Leia o CLAUDE.md.
Objetivo: comunicação do agendamento.
Faça:
- Cliente: e-mail de confirmado, pendente ou aguardando sinal, com .ics e link de cancelar/remarcar via cancel_token (no domínio da marca).
- Dona e profissional: e-mail + push em novo agendamento, cancelamento e remarcação.
- /api/cron/reminders (de hora em hora): lembrete 24h antes, uma vez.
- Página de cancelar/remarcar respeitando antecedência mínima.
Aceite: ciclo completo; cancelar libera o horário na hora.
```

## FASE 7 — Cobrança e produto

### PROMPT 19 — Assinaturas no Asaas

```
Leia o CLAUDE.md. Mostre o plano antes.
Objetivo: cobrar planos e adicionais.
Faça:
- Página de planos no painel: Pro e Equipe, mensal e anual (2 meses grátis), adicionais Destaque (por cidade) e Domínio próprio, campo de cupom (platform_coupons, respeitando brand_key quando definido).
- Criar cliente e assinatura no Asaas (cartão e Pix) conforme ASAAS_ENV (sandbox no desenvolvimento); troca de plano e de ciclo; adicionais como itens separados; descrição da cobrança com o nome da marca.
- Webhook /api/webhooks/asaas com validação de token e idempotência: pago -> ativa; atrasado -> e-mail; cancelado ou vencido após 5 dias -> volta ao Grátis (mesmas regras do fim do teste).
- "Minha assinatura": status, próxima cobrança, histórico e cancelar.
- Registrar mudanças de plano em audit_log.
Aceite: no sandbox, assinar, pagar, falhar, trocar e cancelar funcionam, mesmo com webhook repetido.
```

### PROMPT 20 — PWA e primeiros passos

```
Leia o CLAUDE.md.
Objetivo: painel instalável e guia de início.
Faça:
- Manifest gerado por marca (nome, ícones e cor da marca do domínio) e instruções de instalação para Android e iPhone.
- Checklist "Primeiros passos": completar a página, fotos, link na bio, notificações, QR code, testar o Pro; marcado automaticamente.
Aceite: instalado pelo domínio da barbearia, o app aparece com nome e ícone da barbearia.
```

### PROMPT 21 — Página de vendas de cada marca

```
Leia o CLAUDE.md.
Objetivo: home de vendas na raiz de cada domínio, montada pelos textos do arquivo da marca.
Faça:
- Seções: título, subtítulo, demonstração com uma página de exemplo do nicho, 3 passos, benefícios, planos (Grátis, Pro, Equipe, adicionais), depoimentos, perguntas frequentes e botão de cadastro.
- Termos de Uso e Política de Privacidade por marca (textos-base com aviso para revisão jurídica).
- SEO completo e sitemap por domínio.
Aceite: as duas marcas com homes diferentes a partir do mesmo componente; Lighthouse alto.
```

### PROMPT 22 — Seu painel administrativo

```
Leia o CLAUDE.md. Mostre o plano antes.
Objetivo: área só sua, acessível por qualquer domínio.
Faça:
- Acesso por ADMIN_EMAILS, verificado no servidor; demais recebem 404.
- Lista de negócios com marca, plano, teste, adicionais, cadastro, visitas e agendamentos da semana; filtro por marca.
- Métricas por marca e no total: cadastros por semana, ativação, testes, assinantes, cancelamentos, receita mensal.
- Ações: estender teste, suspender, criar cupons da plataforma; tudo em audit_log.
Aceite: usuário comum recebe 404.
```

### PROMPT 23 — Testes e publicação do núcleo

```
Leia o CLAUDE.md.
Objetivo: garantir o núcleo.
Faça:
- Playwright nas duas marcas: cadastro, pedido de horário, teste do Pro, agendamento pelo chat, cancelamento pelo link, assinatura no sandbox.
- Checklist de produção no README: Supabase de produção, db push, pg_cron, variáveis na Vercel, domínios de cada marca no projeto da Vercel, domínios de envio no Resend com SPF e DKIM, domínio público do R2, Sentry, Asaas em produção (ASAAS_ENV=production).
Aceite: testes passam na prévia da Vercel.
```

## FASE 8 — Equipe e clientes

### PROMPT 24 — Plano Equipe

```
Leia o CLAUDE.md. Mostre o plano antes.
Objetivo: interface para vários profissionais (plano team).
Faça:
- Até professional_limit profissionais: nome, foto, serviços, preço e duração próprios, expediente e folgas.
- Convite por e-mail (staff), com a marca do negócio: vê e gerencia só a própria agenda e recebe só os próprios avisos.
- Agenda em colunas; arrastar para outro profissional ou horário, revalidando no servidor.
- No chat: passo "Profissional" com fotos e "Qualquer profissional".
- Cadastro de recursos (salas/macas) e vínculo com serviços.
- Relatório por profissional: agendamentos, faturamento previsto e faltas.
Aceite: staff isolado; recurso ocupado bloqueia o horário.
```

### PROMPT 25 — Clientes

```
Leia o CLAUDE.md.
Objetivo: base de clientes completa.
Faça:
- Importar CSV (nome, telefone, e-mail, aniversário) com prévia, deduplicação por telefone e relatório de erros.
- Ficha: histórico, gasto previsto, última visita, faltas, pacotes, observações, opt-in.
- Bloquear cliente; regra de limite de faltas.
- Exportar CSV.
Aceite: duplicados não se repetem; bloqueada não conclui agendamento.
```

## FASE 9 — Vendas

### PROMPT 26 — Sinal por Pix

```
Leia o CLAUDE.md. Mostre o plano antes.
Objetivo: sinal pago direto ao profissional.
Faça:
- Serviço com sinal (fixo ou %) gera agendamento awaiting_deposit com deposit_expires_at pelo prazo configurado.
- Tela com QR code e Pix copia e cola no padrão BR Code estático do Banco Central (valor + identificador).
- "Já paguei" para a cliente (muda para informed e avisa a dona por e-mail + push) e "Confirmar sinal recebido" no painel.
- /api/cron/deposits: cancela os vencidos sem confirmação e libera o horário.
- E-mail para a cliente com o Pix e o prazo.
Aceite: QR lido por aplicativo de banco com valor correto; horário liberado após o prazo.
```

### PROMPT 27 — Combos e pacotes

```
Leia o CLAUDE.md.
Objetivo: vender mais por cliente.
Faça:
- Combos com preço promocional, duração somada, disponíveis no chat e no agendamento manual.
- Pacotes de sessões: venda registrada no painel (pagamento fora da plataforma), saldo por cliente, desconto do saldo ao concluir atendimento, aviso quando restar 1 sessão.
Aceite: combo reserva o tempo total; saldo diminui ao concluir.
```

### PROMPT 28 — Lista de espera

```
Leia o CLAUDE.md.
Objetivo: aproveitar cancelamentos.
Faça:
- Entrada na lista pelo chat quando não houver horário no dia.
- Ao cancelar, e-mail para a lista daquele dia e serviço, em ordem, com link para agendar (primeiro que confirmar leva).
- Lista no painel.
Aceite: aviso disparado uma única vez por cancelamento.
```

### PROMPT 29 — Avaliações

```
Leia o CLAUDE.md.
Objetivo: prova social verificada.
Faça:
- Ao concluir atendimento, e-mail com link de avaliação de uso único.
- Avaliações na página e no portal com selo "cliente verificada"; dona pode responder e ocultar (audit_log).
- Após nota 4 ou 5, convite para avaliar no Google (link configurado).
Aceite: só quem teve atendimento concluído avalia, uma vez.
```

### PROMPT 30 — Reativação, retorno e aniversário

```
Leia o CLAUDE.md.
Objetivo: trazer clientes de volta.
Faça:
- "Clientes que sumiram": sem visita há X dias, botão que abre o WhatsApp da dona com mensagem pronta editável.
- "Hora de voltar": lista diária por return_after_days e e-mail automático para quem tem opt-in.
- Aniversários do mês e e-mail automático opcional com cupom (opt-in).
- Modelos de mensagem editáveis, com sugestões da marca.
- Crons idempotentes para esses e-mails.
Aceite: nenhum e-mail de marketing sem opt-in; um envio por ciclo.
```

### PROMPT 31 — Quase agendou

```
Leia o CLAUDE.md.
Objetivo: recuperar desistências.
Faça:
- Lista "Quase agendaram" (abandoned_bookings) com o que a pessoa olhou.
- Botão para WhatsApp da dona com mensagem pronta e "Resolvido".
- Exclusão automática após 30 dias.
Aceite: só registros com consentimento; limpeza funcionando.
```

### PROMPT 32 — Indicação

```
Leia o CLAUDE.md.
Objetivo: cliente trazendo cliente.
Faça:
- referral_code por cliente; e-mail pós-atendimento com o link ?ref=.
- Indicação vira válida quando a indicada conclui o primeiro atendimento.
- Recompensa em texto configurável e lista para a dona aplicar.
Aceite: sem indicações duplicadas; só válidas após atendimento concluído.
```

### PROMPT 33 — Horários vagos, artes e cupons

```
Leia o CLAUDE.md.
Objetivo: encher a agenda.
Faça:
- /api/cron/empty-slots à tarde: se amanhã tiver horários livres acima de um limite, e-mail + push para a dona.
- Artes 1080x1920 (next/og) com o tema da marca e a identidade do negócio: "Agenda aberta", "Horários livres amanhã" (horários reais), "Novo serviço", "Oferta relâmpago" (com cupom), cada uma com QR code e link.
- Baixar e compartilhar (Web Share API).
- Cupons do negócio: código, desconto, validade, uso máximo, aplicados no chat.
Aceite: arte com horários reais; cupom vencido recusado.
```

## FASE 10 — Integrações

### PROMPT 34 — Google Agenda

```
Leia o CLAUDE.md. Mostre o plano antes.
Objetivo: sincronizar com o Google Agenda.
Faça:
- OAuth por profissional com escopo mínimo; tokens cifrados; redirect configurado para o domínio de cada marca.
- Enviar criação, alteração e cancelamento de agendamentos.
- Consultar livre/ocupado e bloquear horários no motor, com cache curto.
- Desconectar remove tokens.
Aceite: compromisso pessoal some dos horários do chat em poucos minutos.
```

### PROMPT 35 — Modal para sites externos e WordPress

```
Leia o CLAUDE.md.
Objetivo: agendar dentro do site da dona.
Faça:
- /embed.js servido em cada domínio de marca: links para /[slug] (ou data-atributo) abrem o chat em modal com iframe; tela cheia no celular; sem script, o link funciona normal.
- postMessage para fechar e ajustar altura, validando a origem.
- Página no painel com código e instruções para Wix, WordPress e sites próprios.
- Plugin WordPress simples em pasta separada.
Aceite: funciona em HTML de teste e em WordPress.
```

## FASE 11 — Portal e crescimento

### PROMPT 36 — Portal de profissionais

```
Leia o CLAUDE.md. Mostre o plano antes.
Objetivo: portal por marca, que traz clientes novos.
Faça:
- Cada marca tem seu portal no próprio domínio, listando só negócios daquela marca (exceto portal_opt_out).
- /explorar/[cidade]/[servico] e /explorar/[cidade]/[bairro]/[servico] com foto, nota, preço a partir de e agendar.
- Indexação: página com pelo menos 3 negócios completos; perfil com foto, descrição e 3 serviços com preço; o resto noindex e fora do sitemap.
- Conteúdo único gerado dos dados: faixa de preço real, quantidade de profissionais, avaliações recentes, perguntas frequentes.
- Busca por cidade e serviço, sitemap automático por domínio, links internos.
- Destaque: negócios com portal_featured ativo aparecem primeiro, marcados.
- portal_events anônimos com brand_key.
Aceite: páginas vazias fora do sitemap; destaque só com adicional ativo; portal de uma marca não mostra negócios de outra.
```

### PROMPT 37 — Radar de demanda

```
Leia o CLAUDE.md.
Objetivo: mostrar a procura na região.
Faça:
- /api/cron/portal-stats consolidando portal_events em portal_stats_monthly.
- Painel: buscas pelo serviço na cidade, quantas vezes o negócio apareceu, horários de pico, serviços mais procurados perto; ocultar números menores que 5.
- Bloco no resumo semanal com sugestão do Destaque quando fizer sentido.
Aceite: nenhum número abaixo de 5 exibido.
```

### PROMPT 38 — Domínio próprio

```
Leia o CLAUDE.md. Mostre o plano antes.
Objetivo: página do negócio no domínio da dona (adicional).
Faça:
- Tela para informar domínio, instruções de DNS e verificação.
- Cadastro do domínio via API de domínios da Vercel, SSL automático.
- Ajustar o middleware: se o Host for um domínio de marca, segue a regra 14; se for um custom_domain verificado, carrega o negócio dono do domínio e a marca dele, e a raiz (/) mostra a página pública desse negócio.
Aceite: domínio de teste abre a página certa com HTTPS e o tema da marca do negócio.
```

### PROMPT 39 — Segmentos, termos e temas

```
Leia o CLAUDE.md.
Objetivo: abrir marcas novas só com configuração.
Faça:
- Completar os arquivos de marca com temas por nicho (beleza: rosa/nude/dourado; barbearia: preto/grafite/dourado; estética: verde-sálvia/bege; psicologia: azul acinzentado/lilás suave; fisioterapia: azul/verde-azulado; personal: preto com cor vibrante; tatuagem: preto com vermelho), fonte e arredondamento.
- Validação automática de contraste de cada tema (texto sobre fundo e sobre botão).
- Termos, serviços sugeridos, textos da página, textos do chat e perguntas frequentes por marca, aplicados na interface pública, no chat, no painel e nos e-mails.
- Criar mais 3 marcas de exemplo (estética, psicologia, fisioterapia) apenas com arquivos de configuração.
Aceite: cada marca nova funciona sem alterar nenhum componente; todos os temas passam no teste de contraste.
```

## FASE 12 — Fechamento

### PROMPT 40 — LGPD, segurança e confiabilidade

```
Leia o CLAUDE.md. Mostre o plano antes.
Objetivo: requisitos legais e técnicos.
Faça:
- Exportar todos os dados do negócio (JSON e CSV); exclusão de conta com remoção do R2.
- Pedido de exclusão de dados de cliente final, atendido pela dona no painel.
- Cabeçalhos de segurança (CSP, HSTS, X-Frame-Options), liberando iframe só na rota do chat.
- audit_log completo nas ações sensíveis.
- Limite de chamadas revisado em todas as rotas públicas e de autenticação.
- /api/health e monitoramento de disponibilidade.
- README com backups do Supabase e plano de recuperação.
Aceite: exportação completa; só o chat pode ser embutido em outros sites.
```

### PROMPT 41 — Revisão final

```
Leia o CLAUDE.md.
Objetivo: revisão antes do lançamento.
Faça:
- Conferir em todas as rotas e ações: zod, getPlanFeatures no servidor, RLS, limite de chamadas e resolução correta da marca.
- Acessibilidade básica no chat e na página pública (contraste, rótulos, teclado).
- Playwright ampliado em pelo menos duas marcas: Equipe, sinal por Pix, lista de espera, avaliação, indicação, portal, modal externo, domínio próprio.
- Relatório de qualquer item do CLAUDE.md não implementado.
Aceite: relatório sem pendências críticas.
```