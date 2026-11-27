import { withSentryConfig } from "@sentry/nextjs/config";
import type { NextConfig } from "next";

/** tesseract.js, its runtime dependencies and the Portuguese data (assets/tessdata). */
const TESSERACT_FILES = [
  "./assets/tessdata/**/*",
  ...[
    "tesseract.js",
    "tesseract.js-core",
    "bmp-js",
    "idb-keyval",
    "is-url",
    "node-fetch",
    "regenerator-runtime",
    "wasm-feature-detect",
    "zlibjs",
    "whatwg-url",
    "tr46",
    "webidl-conversions",
  ].map((name) => `./node_modules/${name}/**/*`),
];

const nextConfig: NextConfig = {
  // .next/standalone: lean Node server copied into the VPS image (Dockerfile.ci, DEPLOY-VPS.md).
  output: "standalone",
  // The dev "N" badge sits over the panel's bottom tabs (dev only; production never shows it).
  devIndicators: false,
  // Local demo mode only (npm run dev:demo): the embedded Postgres loads its own WASM files.
  // tesseract.js (receipt reading, 2026-11-26) starts its own worker thread from node_modules.
  serverExternalPackages: ["@electric-sql/pglite", "tesseract.js", "tesseract.js-core"],
  // The story art reads its font files at runtime (assets/fonts).
  outputFileTracingIncludes: {
    "/painel/vendas/artes/imagem": ["./assets/fonts/**/*"],
    "/og": ["./assets/fonts/**/*"],
    // Receipt reading runs in the actions of the booking chat and of the appointment page: the
    // OCR worker loads these files at runtime, so the trace would miss them.
    "/[slug]": TESSERACT_FILES,
    "/cancelar/[token]": TESSERACT_FILES,
  },
};

// Source map upload only runs when SENTRY_AUTH_TOKEN, SENTRY_ORG and SENTRY_PROJECT are set (e.g. in the GitHub Actions build).
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
});
