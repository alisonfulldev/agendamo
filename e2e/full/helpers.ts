import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { expect, test, type Page } from "@playwright/test";

/**
 * Full-flow tests need a real Supabase project (development) and run only with E2E_FULL=1.
 * They create their own users and businesses with unique slugs and delete them at the end.
 */
export const fullFlows = process.env.E2E_FULL === "1";

export function skipUnlessFull() {
  test.skip(!fullFlows, "Set E2E_FULL=1 with Supabase env vars to run full flows.");
}

let admin: SupabaseClient | undefined;
export function db(): SupabaseClient {
  admin ??= createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
  return admin;
}

export function uniqueSuffix(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/** Confirmed owner account created through the admin API. */
export async function createUser(): Promise<{ id: string; email: string; password: string }> {
  const email = `e2e-${uniqueSuffix()}@example.com`;
  const password = "senha-forte-123";
  const { data, error } = await db().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(`createUser failed: ${error?.message}`);
  return { id: data.user.id, email, password };
}

export async function deleteUser(id: string): Promise<void> {
  await db()
    .from("members")
    .select("business_id")
    .eq("user_id", id)
    .then(async ({ data }) => {
      for (const row of data ?? [])
        await db().from("businesses").delete().eq("id", row.business_id);
    });
  await db().auth.admin.deleteUser(id);
}

export async function signIn(page: Page, brand: string, email: string, password: string) {
  await page.goto(`/entrar?brand=${brand}`);
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(/\/painel/);
}

/** Runs the onboarding wizard with the brand's first suggested service. */
export async function onboard(page: Page, name: string, slug: string) {
  await page.goto("/painel/novo");
  await page.getByLabel("Nome do negócio").fill(name);
  await page.getByLabel("Seu link").fill(slug);
  await expect(page.getByText("Disponível!")).toBeVisible();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByLabel("WhatsApp").fill("11999998888");
  await page.getByLabel("Cidade").fill("São Paulo");
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.locator("button", { hasText: /^\+ / }).first().click();
  await page.getByLabel("Preço (R$)").first().fill("45");
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("button", { name: /Criar meu chat de agendamento/ }).click();
  await expect(
    page.getByRole("heading", { name: "Seu chat de agendamento está no ar!" }),
  ).toBeVisible();
}

export async function businessBySlug(slug: string) {
  const { data } = await db()
    .from("businesses")
    .select("*, services(name)")
    .eq("slug", slug)
    .single();
  return data as { id: string; brand_key: string; plan: string; services: { name: string }[] };
}
