# Deploy na VPS (Magalu Cloud) — banco continua no Supabase

Produção (meetchat.com.br) roda na mesma VPS do TopSitesAdm, que já tem Docker, swap, firewall e o
Caddy (HTTPS automático) em `/opt/apps`. A preparação da VPS e o `docker-compose.yml`/`Caddyfile`
completos vivem no repositório **TopSitesAdm** (`deploy/`); aqui ficam só as partes do agendamo.

Como funciona: a cada push na `main`, o GitHub Actions faz o `next build` (output standalone),
publica `ghcr.io/alisonfulldev/agendamo` e entra na VPS por SSH para dar
`docker compose pull agendamo && docker compose up -d agendamo`. O serviço `topsites` não é tocado.

Arquivos: `.github/workflows/deploy.yml`, `Dockerfile.ci` (imagem só de execução), `Dockerfile`
(build completo, alternativa sem Actions), `deploy/agendamo.env.example`, `deploy/Caddyfile.agendamo`.

## 1. VPS

- `ssh -i ~/.ssh/vps_deploy ubuntu@177.93.130.254`, pasta `/opt/apps`.
- `docker-compose.yml`: serviço `agendamo` (imagem acima, `env_file: ./agendamo.env`,
  `NODE_OPTIONS=--max-old-space-size=640`, `mem_limit: 900m`).
- `Caddyfile`: blocos de `deploy/Caddyfile.agendamo` (site principal e www). Validar antes de
  recarregar:
  `docker compose exec caddy caddy validate --config /etc/caddy/Caddyfile` e
  `docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile`.
- `agendamo.env` (`chmod 600`): valores de Produção da Vercel (`vercel env pull`), **sem aspas e
  sem o `\n` que a Vercel deixa no fim**. Descartar `VERCEL_*`, `TURBO_*`, `NX_*`. Acrescentar
  `APP_ENV=production`. Modelo em `deploy/agendamo.env.example`.

## 2. GitHub (Settings → Secrets and variables → Actions)

- **Variables:** `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`,
  `NEXT_PUBLIC_SENTRY_DSN`, `NEXT_PUBLIC_CONTACT_EMAIL`, `NEXT_PUBLIC_PRICE_TEST_CENTS` (vazia em
  produção), `SENTRY_ORG`, `SENTRY_PROJECT`
- **Secrets:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SENTRY_AUTH_TOKEN`, `VPS_HOST` (IP), `VPS_USER`
  (`ubuntu`), `VPS_SSH_KEY` (conteúdo inteiro da chave privada)

> As `NEXT_PUBLIC_*` são gravadas no JS durante o build: mudou alguma, rode o workflow de novo.

Actions → **Build e deploy** → **Run workflow** (ou um push na `main`).

## 3. Testar antes de virar o DNS

- `docker compose logs --tail 50 agendamo` deve mostrar `Ready`.
- De dentro da VPS: `docker compose exec caddy wget -qO- --header "Host: meetchat.com.br" http://agendamo:3000/ | head`.
- Da sua máquina (o certificado só sai depois do DNS, por isso o `-k`):
  `curl -k --resolve meetchat.com.br:443:177.93.130.254 https://meetchat.com.br/`

## 4. Virada

1. Registro.br (modo avançado: apagar e criar): **A** de `meetchat.com.br` e de `www` →
   `177.93.130.254` (apagar os `76.76.21.21` da Vercel).
2. Em poucos minutos o Caddy emite o SSL (`docker compose logs caddy`).
3. Crons: o pg_cron do Supabase chama `https://meetchat.com.br/api/cron/*`
   (`private.cron_settings.app_url`); com o mesmo domínio nada muda.
4. Webhook do Asaas: mesma URL, nada muda.
5. Deixar a Vercel no ar alguns dias como plano B (voltar = recriar os registros `76.76.21.21`).

## Comandos úteis (em /opt/apps)

- `docker compose ps` / `docker stats --no-stream` → status e memória
- `docker compose logs -f agendamo` → logs ao vivo
- `docker compose pull agendamo && docker compose up -d agendamo` → atualizar à mão
