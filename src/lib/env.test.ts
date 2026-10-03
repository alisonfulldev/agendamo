import { describe, expect, it } from "vitest";

import { clientEnvSchema } from "@/lib/env";

const validClientEnv = {
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: "vapid-public-key",
};

describe("clientEnvSchema", () => {
  it("accepts a valid env and treats an empty Sentry DSN as absent", () => {
    const result = clientEnvSchema.parse({ ...validClientEnv, NEXT_PUBLIC_SENTRY_DSN: "" });
    expect(result.NEXT_PUBLIC_SENTRY_DSN).toBeUndefined();
  });

  it("rejects an invalid Supabase URL", () => {
    const result = clientEnvSchema.safeParse({
      ...validClientEnv,
      NEXT_PUBLIC_SUPABASE_URL: "not-a-url",
    });
    expect(result.success).toBe(false);
  });
});
