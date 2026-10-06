import { withSentryConfig } from "@sentry/nextjs/config";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Local demo mode only (npm run dev:demo): the embedded Postgres loads its own WASM files.
  serverExternalPackages: ["@electric-sql/pglite"],
  // The story art reads its font files at runtime (assets/fonts).
  outputFileTracingIncludes: {
    "/painel/vendas/artes/imagem": ["./assets/fonts/**/*"],
    "/og": ["./assets/fonts/**/*"],
  },
};

// Source map upload only runs when SENTRY_AUTH_TOKEN, SENTRY_ORG and SENTRY_PROJECT are set (e.g. on Vercel).
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
});
