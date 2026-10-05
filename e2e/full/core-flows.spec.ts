import { expect, test } from "@playwright/test";

import { physio } from "../../src/brands/physio";
import { psychology } from "../../src/brands/psychology";
import {
  businessBySlug,
  createUser,
  db,
  deleteUser,
  onboard,
  signIn,
  skipUnlessFull,
  uniqueSuffix,
} from "./helpers";

test.describe.configure({ mode: "serial" });

for (const brand of [psychology, physio]) {
  test.describe(`core flows · ${brand.key}`, () => {
    skipUnlessFull();
    let user: Awaited<ReturnType<typeof createUser>>;
    const slug = `e2e-${brand.key}-${uniqueSuffix()}`;

    test.beforeAll(async () => {
      user = await createUser();
    });
    test.afterAll(async () => {
      if (user) await deleteUser(user.id);
    });

    test("sign-up form sends the confirmation e-mail", async ({ page }) => {
      await page.goto(`/cadastro?brand=${brand.key}`);
      await page.getByLabel("E-mail").fill(`e2e-signup-${uniqueSuffix()}@example.com`);
      await page.getByLabel("Senha").fill("senha-forte-123");
      await page.getByLabel(/Li e aceito/).check();
      await page.getByRole("button", { name: "Criar conta grátis" }).click();
      await expect(page.getByRole("status")).toContainText("Enviamos um link de confirmação");
    });

    test("confirmation link starts a session on the brand domain", async ({ page }) => {
      const { data } = await db().auth.admin.generateLink({ type: "magiclink", email: user.email });
      await page.goto(
        `/auth/confirm?token_hash=${data.properties!.hashed_token}&type=magiclink&next=/painel&brand=${brand.key}`,
      );
      await expect(page).toHaveURL(/\/painel/);
    });

    test("onboarding creates the business with the domain's brand and its services", async ({
      page,
    }) => {
      await signIn(page, brand.key, user.email, user.password);
      await onboard(page, `Negócio ${brand.key}`, slug);
      const business = await businessBySlug(slug);
      expect(business.brand_key).toBe(brand.key);
      expect(business.services.map((s) => s.name)).toContain(brand.suggestedServices[0]!.name);
    });

    test("trial ended: the chat hands off to the owner's WhatsApp and nothing is saved", async ({
      page,
    }) => {
      const business = await businessBySlug(slug);
      const { data: before } = await db()
        .from("businesses")
        .select("trial_ends_at")
        .eq("id", business.id)
        .single();
      await db()
        .from("businesses")
        .update({ trial_ends_at: new Date(Date.now() - 86_400_000).toISOString() })
        .eq("id", business.id);
      try {
        await page.goto(`/${slug}?brand=${brand.key}`);
        await page
          .getByRole("button", { name: brand.suggestedServices[0]!.name, exact: true })
          .click();
        await page
          .getByRole("button", { name: /, \d{1,2} de [a-zç]+$/i })
          .first()
          .click();
        await page
          .locator("button")
          .filter({ hasText: /^\d{2}:\d{2}$/ })
          .first()
          .click();
        await page.getByLabel("Seu nome").fill("Cliente Teste");
        await page.getByRole("button", { name: "Enviar" }).click();
        await page.getByRole("button", { name: "Sem recado" }).click();
        await expect(page.getByRole("link", { name: "Enviar pelo WhatsApp" })).toHaveAttribute(
          "href",
          /wa\.me\//,
        );
        const { count } = await db()
          .from("appointments")
          .select("id", { count: "exact", head: true })
          .eq("business_id", business.id);
        expect(count).toBe(0);
      } finally {
        await db()
          .from("businesses")
          .update({ trial_ends_at: before!.trial_ends_at })
          .eq("id", business.id);
      }
    });

    test("during the trial the link books through the chat; cancelling by link", async ({
      page,
    }) => {
      await page.goto(`/${slug}?brand=${brand.key}`);
      await page
        .getByRole("button", { name: new RegExp(brand.suggestedServices[0]!.name) })
        .click();
      await page
        .getByRole("button", { name: /, \d{1,2} de [a-zç]+$/i })
        .first()
        .click(); // first free day
      await page
        .locator("button")
        .filter({ hasText: /^\d{2}:\d{2}$/ })
        .first()
        .click(); // first time
      await page.getByLabel("Seu nome").fill("Cliente Chat");
      await page.getByRole("button", { name: "Enviar" }).click();
      await page.getByLabel("WhatsApp").fill("11977776666");
      await page.getByRole("button", { name: "Enviar" }).click();
      await page.getByLabel("E-mail").fill("cliente.chat@example.com");
      await page.getByRole("button", { name: "Enviar" }).click();
      const noCoupon = page.getByRole("button", { name: "Não tenho" });
      if (await noCoupon.isVisible()) await noCoupon.click();
      await page.getByRole("button", { name: "Confirmar agendamento" }).click();
      await expect(page.getByRole("link", { name: /Google Agenda/ })).toBeVisible();

      const business = await businessBySlug(slug);
      const { data: appointment } = await db()
        .from("appointments")
        .select("id, cancel_token, status")
        .eq("business_id", business.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      expect(appointment!.status).toBe("confirmed");

      await page.goto(`/cancelar/${appointment!.cancel_token}?brand=${brand.key}`);
      await page.getByRole("button", { name: "Cancelar horário" }).click();
      await page.getByRole("button", { name: "Sim, cancelar" }).click();
      await expect(page.getByText("Horário cancelado.")).toBeVisible();
      const { data: after } = await db()
        .from("appointments")
        .select("status")
        .eq("id", appointment!.id)
        .single();
      expect(after!.status).toBe("cancelled");
    });

    test("subscription checkout redirects to the Asaas sandbox invoice", async ({ page }) => {
      test.skip(!process.env.ASAAS_API_KEY, "Needs ASAAS_API_KEY (sandbox).");
      await signIn(page, brand.key, user.email, user.password);
      await page.goto("/painel/plano");
      await page.getByLabel(/Nome ou razão social/).fill("Cliente Teste E2E");
      await page.getByLabel("CPF ou CNPJ").fill("52998224725");
      await page.getByRole("button", { name: /^Assinar por/ }).click();
      await page.waitForURL(/asaas\.com/, { timeout: 30_000 });
    });
  });
}
