# Colocando no ar: Supabase, Resend, Vercel e Asaas

Guia para sair do modo demonstração e usar os serviços reais. Faça na ordem. Cada passo diz o
que copiar e onde colar. Ao final, `npm run check:setup` confere tudo sem mostrar as chaves.

> O modo demonstração (`npm run dev:demo`) continua existindo só para testes no seu computador.
> Ele nunca liga em produção: na Vercel o sistema usa apenas os serviços reais.

## 0. Antes de começar

- [ ] **Domínios das marcas.** Hoje estão provisórios (`beauty.example.com`…), em
      `src/brands/<marca>.ts` (`domains` e `emailFrom.address`). Enquanto forem provisórios, tudo
      funciona pelo endereço da Vercel (`https://<projeto>.vercel.app/?brand=beauty`) e os links
      dos e-mails também usam esse endereço. Quando comprar os domínios, troque nesses arquivos.
- [ ] Gere os dois segredos do app (guarde num lugar seguro):
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"     # CRON_SECRET
  node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"  # ENCRYPTION_KEY
  ```
  A `ENCRYPTION_KEY` não pode mudar depois (ela cifra os tokens do Google Agenda).

## 1. Supabase (banco e login)

1. Crie a conta em supabase.com e um projeto: região **South America (São Paulo)**, guarde a senha
   do banco.
2. **Project Settings → API Keys**: copie
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - chave pública (_publishable_ ou _anon_) → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - chave secreta (_secret_ ou _service_role_) → `SUPABASE_SERVICE_ROLE_KEY` (nunca no navegador)
3. Aplique as migrations (no terminal, na pasta do projeto):
   ```bash
   npx supabase login
   npx supabase link --project-ref <ref-do-projeto>   # o ref está na URL do painel
   npm run db:push
   ```
   Se reclamar das extensões, ative **pg_cron** e **pg_net** em Database → Extensions e rode de
   novo. O `seed.sql` (dados de exemplo) **não** é aplicado por esse comando.
4. **Authentication → Sign In / Providers → Email**: deixe **Confirm email ligado**. Os e-mails de
   confirmação e de senha saem pelo Resend com a marca (não pelo Supabase).
5. **Authentication → URL Configuration**: _Site URL_ = endereço do app (Vercel ou domínio);
   _Redirect URLs_ = `https://<cada-endereço>/**`.
6. Depois do deploy na Vercel (passo 3), ligue as tarefas agendadas no **SQL Editor**:
   ```sql
   insert into private.cron_settings (key, value) values
     ('app_url', 'https://<endereço-do-app>'),
     ('cron_secret', '<o mesmo CRON_SECRET da Vercel>');
   ```
   Conferir: `select jobname from cron.job;` lista 10 tarefas.

## 2. Resend (e-mails)

1. Crie a conta em resend.com → **API Keys → Create** (permissão _Sending access_) →
   `RESEND_API_KEY`.
2. **Para testar antes de ter domínio:** use `RESEND_FROM="Agendamo <onboarding@resend.dev>"`. Nesse
   modo o Resend só entrega para o e-mail da sua própria conta.
3. **Para valer:** em **Domains → Add domain**, adicione o domínio de cada marca (o do
   `emailFrom.address`), crie no DNS os registros que o Resend mostrar (SPF, DKIM, DMARC) até
   ficar _Verified_ e **apague** o `RESEND_FROM`.

## 3. Vercel (hospedagem)

1. Crie a conta em vercel.com com o GitHub → **Add New → Project → importe `agendamo`**.
   Framework: Next.js (detectado sozinho). Não mude comandos de build.
2. **Settings → Environment Variables** (marque _Production_ e _Preview_):

   | Variável                                                                                 | Valor                                                   |
   | ---------------------------------------------------------------------------------------- | ------------------------------------------------------- |
   | `NEXT_PUBLIC_APP_URL`                                                                    | `https://<projeto>.vercel.app` (ou o domínio principal) |
   | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | do passo 1                                              |
   | `RESEND_API_KEY` (e `RESEND_FROM` só enquanto testa)                                     | do passo 2                                              |
   | `ASAAS_API_KEY`, `ASAAS_WEBHOOK_TOKEN`, `ASAAS_ENV`                                      | do passo 4                                              |
   | `CRON_SECRET`, `ENCRYPTION_KEY`                                                          | do passo 0                                              |
   | `ADMIN_EMAILS`                                                                           | seu e-mail (acesso ao `/admin`)                         |
   | `DEFAULT_BRAND`                                                                          | marca padrão, ex.: `beauty`                             |

   **Não** crie `DEMO_MODE` na Vercel.

3. **Deploy.** Abra `https://<projeto>.vercel.app/api/health`: deve responder `{"ok":true,…}`.
4. Volte ao passo 1.6 (tarefas agendadas) e ao passo 4.3 (webhook do Asaas) com o endereço final.
5. Domínios das marcas (quando tiver): **Settings → Domains → Add**, um por marca (com o `www`
   redirecionando), e atualize `src/brands/<marca>.ts`.
6. Opcional, só para o adicional _Domínio próprio_ dos clientes: **Account Settings → Tokens** →
   `VERCEL_API_TOKEN`; _Project Settings → General_ → `VERCEL_PROJECT_ID` (e `VERCEL_TEAM_ID` se for
   time).

## 4. Asaas (mensalidade com checkout próprio)

O painel tem o checkout próprio (Pix com QR code e cartão). O Asaas só processa por trás e não
manda e-mails de cobrança para a dona (o sistema avisa e mostra o Pix no painel).

1. Comece no **sandbox**: crie a conta em sandbox.asaas.com → **Integrações → Chave de API** →
   `ASAAS_API_KEY`, e `ASAAS_ENV=sandbox`.
2. Invente um token longo (ex.: `node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"`)
   → `ASAAS_WEBHOOK_TOKEN`.
3. **Integrações → Webhooks → Adicionar**:
   - URL: `https://<endereço-do-app>/api/webhooks/asaas`
   - Token de autenticação: o mesmo `ASAAS_WEBHOOK_TOKEN`
   - Eventos: _Cobranças_ (criada, confirmada, recebida, vencida) e _Assinaturas_ (removida,
     inativada). Versão da API v3, envio ativo.
4. Teste no sandbox: assinar com Pix (pague pelo painel do sandbox), assinar com cartão de teste,
   trocar a forma de pagamento e cancelar.
5. Para produção: conta Asaas aprovada, **peça ao Asaas a habilitação da tokenização de cartão**
   (exigida para o cartão no checkout próprio), troque `ASAAS_API_KEY` pela chave de produção e
   `ASAAS_ENV=production`, e cadastre o webhook de novo na conta de produção.

## 5. Conferir

No seu computador, crie `.env.local` com as mesmas variáveis (veja `.env.example`) e rode:

```bash
npm run check:setup   # confere as chaves e a conexão com cada serviço
npm run dev           # o app com os serviços reais em http://localhost:3000
```

Depois, em produção: crie uma conta de teste pelo cadastro, confirme pelo e-mail, crie o negócio,
agende pelo link e assine no sandbox do Asaas.

## Fica para depois (opcional)

R2 (envio de fotos), notificações push, Google Agenda e Sentry estão prontos no código e seguem o
**Checklist de produção** do `README.md`. Sem eles, só o recurso correspondente fica desligado.
