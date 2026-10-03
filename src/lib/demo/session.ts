import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Demo session cookie: `<base64url(json)>.<hmac>`. Signed with a fixed local secret, which is
 * fine because demo mode never runs in production (see isDemoMode).
 */
const SECRET = "lively-local-demo-only";

export interface DemoSession {
  sub: string;
  email: string;
}

function sign(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("base64url");
}

export function encodeDemoSession(session: DemoSession): string {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function decodeDemoSession(value: string | undefined | null): DemoSession | null {
  if (!value) return null;
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as DemoSession;
    return typeof parsed.sub === "string" ? parsed : null;
  } catch {
    return null;
  }
}
