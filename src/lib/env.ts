import { z } from "zod";

const empty = (value: unknown) => (value === "" ? undefined : value);
const optionalString = z.preprocess(empty, z.string().min(1).optional());
const optionalUrl = z.preprocess(empty, z.url().optional());

export const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: optionalString,
  NEXT_PUBLIC_SENTRY_DSN: optionalUrl,
});

/**
 * Supabase is required. Integrations are optional here and required where they are used,
 * via requireServerEnv("R2_BUCKET", ...), so a missing key only breaks that feature.
 */
export const serverEnvSchema = clientEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  R2_ACCOUNT_ID: optionalString,
  R2_ACCESS_KEY_ID: optionalString,
  R2_SECRET_ACCESS_KEY: optionalString,
  R2_BUCKET: optionalString,
  R2_PUBLIC_URL: optionalUrl,
  RESEND_API_KEY: optionalString,
  /**
   * Sender override while the brand domains are not verified: a bare address keeps each brand's
   * name ("nao-responda@dominio.com.br"); "Name <address>" replaces it entirely.
   */
  RESEND_FROM: optionalString,
  VAPID_PRIVATE_KEY: optionalString,
  VAPID_SUBJECT: z.preprocess(empty, z.string().startsWith("mailto:").optional()),
  CRON_SECRET: z.preprocess(
    empty,
    z.string().min(32, "CRON_SECRET must be at least 32 characters").optional(),
  ),
  ASAAS_API_KEY: optionalString,
  ASAAS_WEBHOOK_TOKEN: optionalString,
  ASAAS_ENV: z.preprocess(empty, z.enum(["sandbox", "production"]).default("sandbox")),
  GOOGLE_CLIENT_ID: optionalString,
  GOOGLE_CLIENT_SECRET: optionalString,
  VERCEL_API_TOKEN: optionalString,
  VERCEL_PROJECT_ID: optionalString,
  VERCEL_TEAM_ID: optionalString,
  /** 32 bytes, base64. Encrypts Google tokens and hashes rate-limit keys. */
  ENCRYPTION_KEY: z.preprocess(
    empty,
    z
      .string()
      .refine(
        (value) => Buffer.from(value, "base64").length === 32,
        "ENCRYPTION_KEY must be 32 bytes in base64",
      )
      .optional(),
  ),
  /** Comma-separated e-mails with access to /admin. */
  ADMIN_EMAILS: z.preprocess(
    (value) =>
      typeof value === "string"
        ? value
            .split(",")
            .map((email) => email.trim().toLowerCase())
            .filter(Boolean)
        : [],
    z.array(z.email()),
  ),
  DEFAULT_BRAND: optionalString,
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

function parseEnv<T extends z.ZodType>(schema: T, source: Record<string, unknown>, label: string) {
  const result = schema.safeParse(source);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid ${label} environment variables:\n${issues}`);
  }
  return result.data as z.infer<T>;
}

let clientEnv: ClientEnv | undefined;
let serverEnv: ServerEnv | undefined;

/**
 * Public variables, safe on both server and browser.
 * Each NEXT_PUBLIC_* must be referenced literally so Next.js can inline it in the client bundle.
 */
export function getClientEnv(): ClientEnv {
  clientEnv ??= parseEnv(
    clientEnvSchema,
    {
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    },
    "client",
  );
  return clientEnv;
}

/** True when Supabase is configured (lets pages render a friendly notice in a fresh checkout). */
export function hasSupabaseEnv(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/** Sentry DSN only, so Sentry can start even when the rest of the env is incomplete. */
export function getSentryDsn(): string | undefined {
  return clientEnvSchema.shape.NEXT_PUBLIC_SENTRY_DSN.parse(process.env.NEXT_PUBLIC_SENTRY_DSN);
}

/** All variables, including secrets. Throws if called in the browser. */
export function getServerEnv(): ServerEnv {
  if (typeof window !== "undefined") {
    throw new Error("getServerEnv() must not be called in the browser");
  }
  serverEnv ??= parseEnv(serverEnvSchema, process.env, "server");
  return serverEnv;
}

type Present<T, K extends keyof T> = T & { [P in K]-?: NonNullable<T[P]> };

/** Server env with the given optional keys guaranteed present. Throws naming the missing ones. */
export function requireServerEnv<K extends keyof ServerEnv>(...keys: K[]): Present<ServerEnv, K> {
  const env = getServerEnv();
  const missing = keys.filter((key) => env[key] === undefined || env[key] === null);
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(", ")}`);
  }
  return env as Present<ServerEnv, K>;
}
