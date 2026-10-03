/**
 * Local demo mode (`npm run dev:demo`): Supabase, e-mail and R2 are simulated inside the
 * project so every screen can be tested without external services. Never active in production.
 */
export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === "1" && process.env.NODE_ENV !== "production";
}

/** Password shared by every demo account. */
export const DEMO_PASSWORD = "demo1234";

export const DEMO_SESSION_COOKIE = "lv_demo_session";

/** Where the demo database, captured e-mails and uploaded files live (gitignored). */
export const DEMO_DATA_DIR = ".demo-data";
