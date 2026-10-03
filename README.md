# Lively

Link na bio + agenda + ferramentas de venda para negócios de serviço com horário marcado, vendido como várias marcas (uma por nicho) sobre o mesmo sistema. Regras do produto e da stack em [CLAUDE.md](CLAUDE.md); prompts das etapas em [docs/PROMPTS.md](docs/PROMPTS.md); decisões tomadas na construção em [docs/DECISIONS.md](docs/DECISIONS.md).

## Requisitos

- Node.js 22+
- Google Chrome instalado (usado pelos testes E2E do Playwright)
- Projetos **remotos** no Supabase (desenvolvimento e produção). Não usamos Docker nem `supabase start`.

## Primeiros passos

```bash
npm install
cp .env.example .env.local   # preencha os valores
npm run dev                  # http://localhost:3000
```

As variáveis são validadas com zod em [src/lib/env.ts](src/lib/env.ts). Só o bloco do Supabase é obrigatório; cada integração vazia (R2, Resend, push, Asaas, Google, Vercel) desliga apenas o recurso dela, com mensagem clara.

## Modo demonstração (sem banco nem integrações)

Para testar todas as telas e fluxos antes de configurar Supabase, R2, Resend etc.:

```bash
npm install
npm run dev:demo             # abra http://localhost:3000/demo
```

- **Banco:** um Postgres embutido (PGlite, o mesmo dos testes) com todas as migrations, salvo em `.demo-data/` (fora do git). Os dados continuam entre reinícios.
- **Contas prontas** (senha `demo1234`): uma por marca e por plano (Grátis, teste do Pro, Pro, Equipe), uma profissional de equipe, uma conta sem negócio e o administrador. Na página `/demo`, um clique entra em qualquer uma.
- **Dados de exemplo:** clientes, horários passados e futuros, pedidos, avaliações, cupons, pacotes, lista de espera, “quase agendaram” e 60 dias de estatísticas.
- **E-mails:** nada sai do computador. Cada e-mail aparece na caixa de entrada da página `/demo`, com os links funcionando (confirmar conta, cancelar, avaliar…).
- **Fotos:** o upload segue o mesmo fluxo de URL assinada, mas grava em `.demo-data/files`.
- **Também em `/demo`:** trocar o plano de qualquer negócio na hora, rodar as tarefas agendadas (lembretes, sinais vencidos, resumo semanal…) e apagar tudo para recomeçar.
- **Fica de fora:** cobrança Asaas, Google Agenda, notificação push, domínio próprio (Vercel) e Sentry. Essas telas abrem, mas as ações delas avisam que a integração não está configurada.

O modo só liga com `npm run dev:demo` (variável `DEMO_MODE=1`) e nunca em produção (`NODE_ENV=production` desliga). `npm run test:e2e:demo` abre todas as telas com cada conta e falha em qualquer erro.

## Multimarcas

Um único projeto e um único banco atendem várias marcas, cada uma no seu domínio. As rotas são as mesmas para todas:

| Rota                                    | O quê                                           |
| --------------------------------------- | ----------------------------------------------- |
| `/`                                     | Página de vendas da marca                       |
| `/entrar`, `/cadastro`                  | Acesso                                          |
| `/painel/...`                           | Painel do negócio                               |
| `/[slug]`                               | Página pública do negócio                       |
| `/[slug]/agendar`                       | Chat sozinho (usado no modal de sites externos) |
| `/explorar/[cidade]/[servico]`          | Portal da marca                                 |
| `/cancelar/[token]`, `/avaliar/[token]` | Páginas da cliente                              |
| `/admin`                                | Administração da plataforma (`ADMIN_EMAILS`)    |

### Como a marca é escolhida

1. [src/proxy.ts](src/proxy.ts) (o antigo `middleware.ts`) lê o `Host`, resolve a marca com `getBrandByHost` ([src/brands/resolve.ts](src/brands/resolve.ts)) e repassa a chave no cabeçalho interno `x-brand`. Um `x-brand` enviado pelo navegador é sobrescrito.
2. Domínio de produção (com ou sem `www`) → marca dona do domínio. Ali `?brand=` é ignorado.
3. Em `localhost` e nas prévias `*.vercel.app`: `?brand=<key>` escolhe a marca e fica gravado no cookie `brand`.
4. Domínio próprio verificado de um negócio → marca do negócio, e `/` mostra a página dele.
5. Qualquer outro host → `DEFAULT_BRAND`.

Para testar localmente: `/?brand=beauty`, `/?brand=barber`, `/?brand=aesthetics`, `/?brand=psychology`, `/?brand=physio`.

### Tema, cores e termos

O layout raiz aplica o tema da marca como variáveis CSS (`--brand-*`) no `<html>`; [src/app/globals.css](src/app/globals.css) liga essas variáveis aos tokens do Tailwind/shadcn. **Nenhuma cor fixa fora dos arquivos de marca**: [src/no-hardcoded-colors.test.ts](src/no-hardcoded-colors.test.ts) falha se aparecer hex, `rgb()`/`oklch()` ou classes de paleta. Todos os temas passam no teste de contraste AA (4,5:1) em [src/brands/brands.test.ts](src/brands/brands.test.ts). Termos (cliente/paciente, serviço/procedimento…), textos do chat, serviços sugeridos e mensagens prontas vêm do arquivo da marca.

### Cache

As páginas são dinâmicas e saem com `Cache-Control: no-store`. Os dados da página pública e do portal ficam em cache curto com **a marca na chave** e são expirados a cada edição. Qualquer cache novo precisa incluir `brand.key` na chave.

### Adicionar uma marca nova

1. Copie [src/brands/beauty.ts](src/brands/beauty.ts) para `src/brands/<key>.ts`, ajuste tudo e registre em `parseBrands([...])` no [src/brands/index.ts](src/brands/index.ts). Tudo é validado com zod quando o servidor sobe.
2. Logo e favicon em `public/brands/<key>/`.
3. Fonte nova: `FONT_CSS_VARIABLES` no schema + [src/brands/fonts.ts](src/brands/fonts.ts).
4. Domínio no projeto da Vercel (e o `www` redirecionando) e no Resend (SPF, DKIM, DMARC).
5. Domínio como "Authorized redirect URI" no Google Cloud (`https://<dominio>/api/google/callback`).
6. `npm test` (contraste e schema) e abra `/?brand=<key>`.

## Scripts

| Comando                 | O que faz                                       |
| ----------------------- | ----------------------------------------------- |
| `npm run dev`           | Servidor de desenvolvimento                     |
| `npm run dev:demo`      | Modo demonstração local (sem serviços externos) |
| `npm run build`         | Build de produção                               |
| `npm run lint`          | ESLint                                          |
| `npm run typecheck`     | Gera tipos de rotas do Next e roda `tsc`        |
| `npm run format`        | Prettier (escreve)                              |
| `npm run format:check`  | Prettier (só verifica)                          |
| `npm test`              | Vitest: unitários + testes do banco (PGlite)    |
| `npm run test:e2e`      | Playwright (sobe o `next dev`)                  |
| `npm run test:e2e:demo` | Playwright: todas as telas no modo demonstração |
| `npm run db:new <nome>` | Cria uma migration vazia                        |
| `npm run db:push`       | Aplica migrations pendentes no projeto linkado  |

## Testes

- **Unitários** (`src/**/*.test.ts`): motor de horários, preços e sinal, Pix (BR Code com o CRC do exemplo do Banco Central), CSV, planos, marcas…
- **Banco** (`supabase/tests/*.test.ts`): todas as migrations rodam num Postgres em memória (PGlite) com um stub do Supabase. Provam RLS (isolamento entre negócios e staff), conflito de horário por profissional e por recurso, cupons, estatísticas idempotentes, portal e cron.
- **E2E** (`e2e/*.spec.ts`): marcas, cache entre marcas, embed e cabeçalhos de segurança. Rodam sem Supabase.
- **E2E de fluxo completo** (`e2e/full/*.spec.ts`): cadastro, pedido, teste do Pro, chat, cancelamento, assinatura no sandbox, Equipe, Pix, lista de espera, avaliação, indicação, portal, modal e domínio. Precisam do Supabase de desenvolvimento:

  ```bash
  E2E_FULL=1 npm run test:e2e        # com .env.local apontando para o Supabase de dev
  ```

## Banco de dados (Supabase CLI, só migrations)

```bash
npx supabase login
npx supabase link --project-ref <project-ref>   # projeto de desenvolvimento
npx supabase db push --dry-run                  # confere
npm run db:push                                 # aplica
npx supabase db push --include-seed             # opcional: dados de exemplo (supabase/seed.sql)
```

Nunca edite uma migration já aplicada: crie outra com `npm run db:new`.

## Checklist de produção

Faça nesta ordem. Cada item tem como conferir.

### 1. Supabase

- [ ] Criar o projeto de **produção** (o de desenvolvimento já deve existir) na região São Paulo.
- [ ] `npx supabase link --project-ref <prod>` e `npm run db:push`.
- [ ] Ativar as extensões **pg_cron** e **pg_net** (Database → Extensions), se a migration não conseguir sozinha.
- [ ] Configurar as rotas de cron (uma vez, no SQL Editor):
  ```sql
  insert into private.cron_settings (key, value) values
    ('app_url', 'https://<dominio-principal>'),
    ('cron_secret', '<mesmo valor de CRON_SECRET na Vercel>');
  ```
  Conferir: `select * from cron.job;` lista 10 tarefas; `select * from net._http_response order by id desc limit 5;` mostra respostas 200.
- [ ] Authentication → URL Configuration: "Site URL" = domínio principal; "Redirect URLs" = `https://<cada-dominio>/**`.
- [ ] Authentication → Email: manter "Confirm email" ligado. Os e-mails de autenticação saem pelo Resend com a marca (não pelo Supabase).
- [ ] Copiar URL, anon key e service role key para a Vercel.

### 2. Cloudflare R2

- [ ] Criar o bucket e um token com leitura e escrita nele.
- [ ] Ativar o domínio público do bucket (R2.dev ou domínio próprio) → `R2_PUBLIC_URL`.
- [ ] CORS do bucket:
  ```json
  [
    {
      "AllowedOrigins": ["https://<cada-dominio-de-marca>"],
      "AllowedMethods": ["PUT"],
      "AllowedHeaders": ["content-type", "cache-control"],
      "MaxAgeSeconds": 3600
    }
  ]
  ```

### 3. Resend

- [ ] Para **cada marca**: adicionar o domínio do `emailFrom.address` e criar SPF, DKIM (e DMARC) no DNS até ficar "Verified".
- [ ] `RESEND_API_KEY` na Vercel. **Não** definir `RESEND_FROM` em produção (ele sobrescreve o remetente da marca).

### 4. Web push

- [ ] `npx web-push generate-vapid-keys` → `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`; `VAPID_SUBJECT=mailto:<seu-email>`.

### 5. Asaas

- [ ] Conta de produção aprovada; chave da API → `ASAAS_API_KEY`; `ASAAS_ENV=production`.
- [ ] Webhook: URL `https://<dominio-principal>/api/webhooks/asaas`, token de autenticação → `ASAAS_WEBHOOK_TOKEN`, eventos de **cobranças** e **assinaturas**.
- [ ] Testar antes no sandbox (`ASAAS_ENV=sandbox`): assinar, pagar, falhar, trocar e cancelar.

### 6. Google Agenda

- [ ] Projeto no Google Cloud com a Google Calendar API ativada.
- [ ] Tela de consentimento com os escopos `calendar.events` e `calendar.freebusy` (precisa de verificação do Google para sair do modo de teste).
- [ ] Cliente OAuth "Web" com um redirect por domínio: `https://<dominio>/api/google/callback` → `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.

### 7. Vercel

- [ ] Projeto conectado ao repositório privado do GitHub.
- [ ] Todas as variáveis do `.env.example` em Production (e Preview, apontando para o Supabase de desenvolvimento e Asaas sandbox).
- [ ] `CRON_SECRET` (32+ caracteres) e `ENCRYPTION_KEY` (`node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`). **Guarde a ENCRYPTION_KEY**: trocá-la invalida os tokens do Google salvos.
- [ ] Domínios de **todas** as marcas em Settings → Domains (com `www` redirecionando).
- [ ] Domínio próprio de clientes: token da Vercel com acesso ao projeto → `VERCEL_API_TOKEN`, `VERCEL_PROJECT_ID` (e `VERCEL_TEAM_ID` se for time).
- [ ] `ADMIN_EMAILS` com o seu e-mail.

### 8. Sentry e monitoramento

- [ ] Projeto Next.js no Sentry → `NEXT_PUBLIC_SENTRY_DSN`; para source maps, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`.
- [ ] Monitor de disponibilidade (Better Stack, UptimeRobot…) chamando `https://<dominio-principal>/api/health` a cada minuto. Responde 503 quando o banco não responde.

### 9. Conferência final

- [ ] `E2E_FULL=1 npm run test:e2e` contra a prévia da Vercel (Supabase de dev, Asaas sandbox).
- [ ] Cadastro real em dois domínios de marca, e-mail de confirmação chegando com a marca certa.
- [ ] Revisar Termos de Uso e Política de Privacidade com advogado (as páginas mostram o aviso de texto-base).

## Backups e plano de recuperação

- **Backups**: o Supabase faz backup diário nos planos pagos (Database → Backups). Para produção, ative **Point-in-Time Recovery** (restaura para qualquer minuto dos últimos dias). Imagens ficam no R2 (durável por padrão); se quiser cópia extra, configure replicação/lifecycle do bucket.
- **Exportação pelos clientes**: cada negócio baixa todos os seus dados em Conta → Exportar dados (JSON e CSV).
- **Recuperação**:
  1. Banco corrompido ou dados apagados por engano: Supabase → Backups → restaurar o ponto anterior ao incidente (PITR) num projeto novo, conferir e trocar as variáveis da Vercel, ou restaurar no mesmo projeto em janela de manutenção.
  2. Migration com problema: nunca edite a aplicada; crie uma migration corretiva e rode `npm run db:push`.
  3. Vazamento de segredo: gire a chave no serviço (Supabase service role, Asaas, Resend, R2, Google) e atualize a Vercel. `CRON_SECRET` também precisa ser trocado em `private.cron_settings`.
  4. Fora do ar: `/api/health` + Sentry mostram se é aplicação ou banco; a Vercel permite voltar ao deploy anterior em um clique (Instant Rollback).
- **Tarefas agendadas** são idempotentes: rodar de novo depois de uma falha não duplica e-mails nem estatísticas.

## Supabase no código

- `src/lib/supabase/server.ts`: sessão do usuário, RLS aplica.
- `src/lib/supabase/browser.ts`: Client Components, RLS aplica.
- `src/lib/supabase/admin.ts`: service role, **ignora RLS**, só no servidor (`server-only`). Usado depois de conferir permissão no código.
- `src/lib/supabase/anon.ts`: leituras públicas cacheáveis (só funções públicas).

## Plugin WordPress

Em [wordpress-plugin/agendamento-online](wordpress-plugin/agendamento-online): compacte a pasta em .zip e instale pelo WordPress. Veja o `readme.txt`.
