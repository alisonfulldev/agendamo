import "server-only";

import { randomBytes, randomInt, randomUUID } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";

import { getDemoDb } from "./db";
import { DEMO_SESSION_COOKIE } from "./mode";
import { DemoQueryBuilder, DemoRpcBuilder, type Actor, type DemoContext } from "./query";
import { decodeDemoSession, encodeDemoSession, type DemoSession } from "./session";

/**
 * Drop-in stand-in for the Supabase clients in demo mode: database calls go to the local
 * PGlite and auth is a signed cookie with plain-text local passwords.
 */
export interface DemoCookies {
  get(name: string): string | undefined;
  set(name: string, value: string): void;
  delete(name: string): void;
}

type ClientKind = "user" | "anon" | "admin";

interface AuthUser {
  id: string;
  email: string;
  encrypted_password: string | null;
  email_confirmed_at: string | null;
  created_at: string;
  raw_user_meta_data: Record<string, unknown> | null;
}

const authError = (message: string, code: string, status = 400) => ({
  name: "AuthApiError",
  message,
  code,
  status,
});

const toUser = (user: AuthUser) => ({
  id: user.id,
  email: user.email,
  created_at: user.created_at,
  email_confirmed_at: user.email_confirmed_at,
  app_metadata: {},
  user_metadata: user.raw_user_meta_data ?? {},
  aud: "authenticated",
});

async function sql<T>(query: string, params: unknown[] = []): Promise<T[]> {
  const db = await getDemoDb();
  return (await db.query<T>(query, params)).rows;
}

async function findUserByEmail(email: string): Promise<AuthUser | null> {
  const rows = await sql<AuthUser>(
    "select id, email, encrypted_password, email_confirmed_at, created_at, raw_user_meta_data from auth.users where lower(email) = lower($1)",
    [email],
  );
  return rows[0] ?? null;
}

async function findUserById(id: string): Promise<AuthUser | null> {
  const rows = await sql<AuthUser>(
    "select id, email, encrypted_password, email_confirmed_at, created_at, raw_user_meta_data from auth.users where id = $1",
    [id],
  );
  return rows[0] ?? null;
}

/** Creates a demo account (used by the demo seed and by sign-up / invite links). */
export async function createDemoUser(
  email: string,
  password: string | null,
  confirmed: boolean,
  id: string = randomUUID(),
  metadata: Record<string, unknown> = {},
): Promise<AuthUser> {
  const rows = await sql<AuthUser>(
    `insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
     values ($1, lower($2), $3, case when $4 then now() end, $5::jsonb)
     returning id, email, encrypted_password, email_confirmed_at, created_at, raw_user_meta_data`,
    [id, email, password, confirmed, JSON.stringify(metadata)],
  );
  return rows[0]!;
}

/** 6-digit e-mail code (as Supabase's email_otp), kept as a token bound to the e-mail. */
async function createEmailCode(userId: string, email: string, type: string): Promise<string> {
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await sql("insert into demo.auth_tokens (token, user_id, type) values ($1, $2, $3)", [
    `otp:${email.toLowerCase()}:${code}`,
    userId,
    type,
  ]);
  return code;
}

async function createToken(userId: string, type: string): Promise<string> {
  const token = randomBytes(24).toString("hex");
  await sql("insert into demo.auth_tokens (token, user_id, type) values ($1, $2, $3)", [
    token,
    userId,
    type,
  ]);
  return token;
}

function createAuth(cookies: DemoCookies | null, setSession: (s: DemoSession | null) => void) {
  const current = () => decodeDemoSession(cookies?.get(DEMO_SESSION_COOKIE));
  const startSession = (user: AuthUser) => {
    const session = { sub: user.id, email: user.email };
    cookies?.set(DEMO_SESSION_COOKIE, encodeDemoSession(session));
    setSession(session);
  };

  return {
    async getClaims() {
      const session = current();
      return session
        ? { data: { claims: { sub: session.sub, email: session.email } }, error: null }
        : { data: null, error: null };
    },

    async getUser() {
      const session = current();
      const user = session ? await findUserById(session.sub) : null;
      return user
        ? { data: { user: toUser(user) }, error: null }
        : {
            data: { user: null },
            error: authError("Auth session missing!", "session_not_found", 401),
          };
    },

    async signInWithPassword({ email, password }: { email: string; password: string }) {
      const user = await findUserByEmail(email);
      if (!user || user.encrypted_password !== password) {
        return {
          data: { user: null, session: null },
          error: authError("Invalid login credentials", "invalid_credentials"),
        };
      }
      if (!user.email_confirmed_at) {
        return {
          data: { user: null, session: null },
          error: authError("Email not confirmed", "email_not_confirmed"),
        };
      }
      startSession(user);
      return { data: { user: toUser(user), session: {} }, error: null };
    },

    async signOut() {
      cookies?.delete(DEMO_SESSION_COOKIE);
      setSession(null);
      return { error: null };
    },

    async updateUser({
      password,
      email,
      data,
    }: {
      password?: string;
      email?: string;
      data?: Record<string, unknown>;
    }) {
      const session = current();
      const user = session ? await findUserById(session.sub) : null;
      if (!user)
        return {
          data: { user: null },
          error: authError("Auth session missing!", "session_not_found", 401),
        };
      if (password !== undefined) {
        if (password === user.encrypted_password) {
          return {
            data: { user: null },
            error: authError(
              "New password should be different from the old password.",
              "same_password",
              422,
            ),
          };
        }
        await sql("update auth.users set encrypted_password = $2 where id = $1", [
          user.id,
          password,
        ]);
      }
      if (email !== undefined) {
        await sql("update auth.users set email = lower($2) where id = $1", [user.id, email]);
      }
      if (data !== undefined) {
        await sql(
          "update auth.users set raw_user_meta_data = raw_user_meta_data || $2::jsonb where id = $1",
          [user.id, JSON.stringify(data)],
        );
      }
      return { data: { user: toUser({ ...user, email: email ?? user.email }) }, error: null };
    },

    async verifyOtp({
      token_hash,
      email,
      token,
      type,
    }: {
      token_hash?: string;
      email?: string;
      token?: string;
      type: string;
    }) {
      const key = token_hash ?? `otp:${(email ?? "").toLowerCase()}:${token ?? ""}`;
      const rows = await sql<{ user_id: string; type: string }>(
        "delete from demo.auth_tokens where token = $1 returning user_id, type",
        [key],
      );
      const row = rows[0];
      const compatible =
        row && (row.type === type || (type === "email" && row.type !== "recovery"));
      if (!compatible) {
        return {
          data: { user: null, session: null },
          error: authError("Email link is invalid or has expired", "otp_expired", 403),
        };
      }
      await sql(
        "update auth.users set email_confirmed_at = coalesce(email_confirmed_at, now()) where id = $1",
        [row.user_id],
      );
      const user = (await findUserById(row.user_id))!;
      startSession(user);
      return { data: { user: toUser(user), session: {} }, error: null };
    },

    admin: {
      async generateLink(params: { type: string; email: string; password?: string }) {
        const existing = await findUserByEmail(params.email);
        let user = existing;
        if (params.type === "signup" || params.type === "invite") {
          if (existing?.email_confirmed_at) {
            return {
              data: { user: null, properties: null },
              error: authError(
                "A user with this email address has already been registered",
                "email_exists",
                422,
              ),
            };
          }
          user = existing ?? (await createDemoUser(params.email, params.password ?? null, false));
          if (existing && params.password) {
            await sql("update auth.users set encrypted_password = $2 where id = $1", [
              existing.id,
              params.password,
            ]);
          }
        } else if (!existing) {
          return {
            data: { user: null, properties: null },
            error: authError("User not found", "user_not_found", 404),
          };
        }
        const token = await createToken(user!.id, params.type);
        const emailOtp = await createEmailCode(user!.id, user!.email, params.type);
        return {
          data: {
            user: toUser(user!),
            properties: {
              hashed_token: token,
              action_link: "",
              email_otp: emailOtp,
              redirect_to: "",
              verification_type: params.type,
            },
          },
          error: null,
        };
      },

      async createUser(params: {
        email: string;
        password?: string;
        email_confirm?: boolean;
        user_metadata?: Record<string, unknown>;
      }) {
        if (await findUserByEmail(params.email)) {
          return {
            data: { user: null },
            error: authError(
              "A user with this email address has already been registered",
              "email_exists",
              422,
            ),
          };
        }
        const user = await createDemoUser(
          params.email,
          params.password ?? null,
          Boolean(params.email_confirm),
          undefined,
          params.user_metadata ?? {},
        );
        return { data: { user: toUser(user) }, error: null };
      },

      async getUserById(id: string) {
        const user = await findUserById(id);
        return user
          ? { data: { user: toUser(user) }, error: null }
          : { data: { user: null }, error: authError("User not found", "user_not_found", 404) };
      },

      async updateUserById(id: string, attributes: { user_metadata?: Record<string, unknown> }) {
        if (attributes.user_metadata) {
          await sql(
            "update auth.users set raw_user_meta_data = raw_user_meta_data || $2::jsonb where id = $1",
            [id, JSON.stringify(attributes.user_metadata)],
          );
        }
        const user = await findUserById(id);
        return user
          ? { data: { user: toUser(user) }, error: null }
          : { data: { user: null }, error: authError("User not found", "user_not_found", 404) };
      },

      async deleteUser(id: string) {
        await sql("delete from auth.users where id = $1", [id]);
        return { data: { user: null }, error: null };
      },
    },
  };
}

export function createDemoClient(kind: ClientKind, cookies: DemoCookies | null): SupabaseClient {
  let session = kind === "user" ? decodeDemoSession(cookies?.get(DEMO_SESSION_COOKIE)) : null;
  const actor = (): Actor =>
    kind === "admin"
      ? { role: "service_role" }
      : session
        ? { role: "authenticated", userId: session.sub }
        : { role: "anon" };
  const ctx: DemoContext = { db: getDemoDb, actor };
  const client = {
    from: (table: string) => new DemoQueryBuilder(ctx, table),
    rpc: (fn: string, args: Record<string, unknown> = {}) => new DemoRpcBuilder(ctx, fn, args),
    auth: createAuth(cookies, (next) => {
      session = next;
    }),
  };
  return client as unknown as SupabaseClient;
}
