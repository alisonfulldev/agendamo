// Local demo mode: `npm run dev:demo`. Simulates Supabase (embedded Postgres), e-mail and R2
// inside the project, so every screen can be tested with no external service. See README.
import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const port = process.env.PORT ?? "3000";
const appUrl = `http://localhost:${port}`;

const env = {
  ...process.env,
  DEMO_MODE: "1",
  NEXT_PUBLIC_APP_URL: appUrl,
  // Placeholders: nothing ever connects to them in demo mode.
  NEXT_PUBLIC_SUPABASE_URL: "http://localhost:54321",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "demo-anon-key",
  SUPABASE_SERVICE_ROLE_KEY: "demo-service-role-key",
  CRON_SECRET: "demo-cron-secret-0123456789abcdef0123",
  ENCRYPTION_KEY: Buffer.alloc(32, 7).toString("base64"),
  ADMIN_EMAILS: "admin@demo.com",
  // Real integrations stay off even if .env.local has keys.
  RESEND_API_KEY: "",
  ASAAS_API_KEY: "",
  GOOGLE_CLIENT_ID: "",
  GOOGLE_CLIENT_SECRET: "",
  VERCEL_API_TOKEN: "",
  NEXT_PUBLIC_SENTRY_DSN: "",
};

const require = createRequire(import.meta.url);
const nextBin = require.resolve("next/dist/bin/next");

console.log(`\n  Modo demonstração: abra ${appUrl}/demo\n`);
const child = spawn(process.execPath, [nextBin, "dev", "--port", port], {
  env,
  stdio: "inherit",
});
child.on("exit", (code) => process.exit(code ?? 0));
