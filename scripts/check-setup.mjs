// npm run check:setup — confere as variáveis de .env.local (ou do ambiente) e testa a conexão com
// Supabase, Resend, Asaas e Vercel. Não mostra nenhuma chave na tela.
import { existsSync } from "node:fs";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const env = process.env;

const results = [];
const ok = (group, text) => results.push(["✅", group, text]);
const warn = (group, text) => results.push(["⚠️ ", group, text]);
const fail = (group, text) => results.push(["❌", group, text]);
const has = (key) => Boolean(env[key] && env[key].trim());

async function probe(group, label, url, init) {
  try {
    const response = await fetch(url, { ...init, signal: AbortSignal.timeout(15_000) });
    if (response.ok) ok(group, `${label}: conectou`);
    else fail(group, `${label}: respondeu ${response.status} (chave errada ou sem permissão?)`);
  } catch (error) {
    fail(group, `${label}: sem conexão (${error.message})`);
  }
}

// App
if (has("NEXT_PUBLIC_APP_URL")) ok("App", `NEXT_PUBLIC_APP_URL = ${env.NEXT_PUBLIC_APP_URL}`);
else fail("App", "NEXT_PUBLIC_APP_URL vazio");
if (env.DEMO_MODE === "1")
  warn("App", "DEMO_MODE=1 está definido: remova para usar os serviços reais");
if ((env.CRON_SECRET ?? "").length >= 32) ok("App", "CRON_SECRET ok");
else fail("App", "CRON_SECRET precisa de 32+ caracteres");
if (has("ENCRYPTION_KEY") && Buffer.from(env.ENCRYPTION_KEY, "base64").length === 32)
  ok("App", "ENCRYPTION_KEY ok (32 bytes)");
else fail("App", "ENCRYPTION_KEY precisa ter 32 bytes em base64");
if (has("ADMIN_EMAILS")) ok("App", "ADMIN_EMAILS definido");
else warn("App", "ADMIN_EMAILS vazio: ninguém acessa /admin");

// Supabase
if (
  has("NEXT_PUBLIC_SUPABASE_URL") &&
  has("NEXT_PUBLIC_SUPABASE_ANON_KEY") &&
  has("SUPABASE_SERVICE_ROLE_KEY")
) {
  await probe("Supabase", "API (chave pública)", `${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/health`, {
    headers: { apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY },
  });
  await probe(
    "Supabase",
    "banco com a chave secreta (tabela businesses — exige as migrations aplicadas)",
    `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/businesses?select=id&limit=1`,
    {
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    },
  );
} else
  fail(
    "Supabase",
    "URL, chave pública (anon/publishable) e chave secreta (service role/secret) são obrigatórias",
  );

// Resend
if (has("RESEND_API_KEY")) {
  await probe("Resend", "API", "https://api.resend.com/domains", {
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}` },
  });
  if (has("RESEND_FROM"))
    warn("Resend", `RESEND_FROM = ${env.RESEND_FROM} (só para testes; em produção deixe vazio)`);
} else
  warn(
    "Resend",
    "RESEND_API_KEY vazio: os e-mails só aparecem no log (cadastro não recebe confirmação)",
  );

// Asaas
if (has("ASAAS_API_KEY")) {
  const base =
    env.ASAAS_ENV === "production"
      ? "https://api.asaas.com/v3"
      : "https://api-sandbox.asaas.com/v3";
  await probe(
    "Asaas",
    `API (${env.ASAAS_ENV === "production" ? "produção" : "sandbox"})`,
    `${base}/customers?limit=1`,
    {
      headers: { access_token: env.ASAAS_API_KEY, "User-Agent": "Lively" },
    },
  );
  if (has("ASAAS_WEBHOOK_TOKEN")) ok("Asaas", "ASAAS_WEBHOOK_TOKEN definido");
  else fail("Asaas", "ASAAS_WEBHOOK_TOKEN vazio: o webhook recusa os avisos de pagamento");
} else warn("Asaas", "ASAAS_API_KEY vazio: a assinatura fica indisponível");

// Vercel (domínio próprio dos negócios — opcional)
if (has("VERCEL_API_TOKEN") && has("VERCEL_PROJECT_ID")) {
  const team = has("VERCEL_TEAM_ID") ? `?teamId=${env.VERCEL_TEAM_ID}` : "";
  await probe(
    "Vercel",
    "API do projeto",
    `https://api.vercel.com/v9/projects/${env.VERCEL_PROJECT_ID}${team}`,
    {
      headers: { Authorization: `Bearer ${env.VERCEL_API_TOKEN}` },
    },
  );
} else
  warn(
    "Vercel",
    "VERCEL_API_TOKEN/PROJECT_ID vazios: só o adicional Domínio próprio fica desligado",
  );

// Opcionais
for (const [group, keys] of [
  [
    "R2 (fotos)",
    ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET", "R2_PUBLIC_URL"],
  ],
  ["Push", ["NEXT_PUBLIC_VAPID_PUBLIC_KEY", "VAPID_PRIVATE_KEY", "VAPID_SUBJECT"]],
  ["Google Agenda", ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"]],
  ["Sentry", ["NEXT_PUBLIC_SENTRY_DSN"]],
]) {
  if (keys.every(has)) ok(group, "configurado");
  else warn(group, "não configurado (opcional por enquanto)");
}

for (const [icon, group, text] of results) console.log(`${icon} ${group.padEnd(14)} ${text}`);
const failed = results.some(([icon]) => icon === "❌");
console.log(
  failed ? "\nCorrija os itens ❌ acima." : "\nTudo certo para rodar com os serviços reais.",
);
process.exit(failed ? 1 : 0);
