import * as Sentry from "@sentry/nextjs";

export async function register() {
  // Validates every brand file at startup (throws on invalid config).
  await import("@/brands");

  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
