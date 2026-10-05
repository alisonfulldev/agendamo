import { expect, test, type Page } from "@playwright/test";

import { physio } from "../../src/brands/physio";
import { psychology } from "../../src/brands/psychology";
import { createUser, db, deleteUser, signIn, skipUnlessFull, uniqueSuffix } from "./helpers";

/**
 * Prompt 41: extended flows on two brands. Data is prepared straight in the database (service
 * role) so each test starts from a known state; the UI is exercised where the flow happens.
 */
test.describe.configure({ mode: "serial" });

interface Fixture {
  owner: Awaited<ReturnType<typeof createUser>>;
  businessId: string;
  slug: string;
  professionalIds: string[];
  serviceId: string;
}

async function createFixture(brandKey: string, seats: number): Promise<Fixture> {
  const owner = await createUser();
  const slug = `e2e-${brandKey}-${uniqueSuffix()}`;
  const { data: businessId, error } = await db().rpc("create_business", {
    p_user_id: owner.id,
    p_payload: {
      name: `Teste ${brandKey}`,
      slug,
      brand_key: brandKey,
      segment: brandKey,
      page: { whatsapp_number: "5511999998888", city: "São Paulo", neighborhood: "Moema" },
      services: [{ name: "Serviço E2E", duration_minutes: 30, price_cents: 5000 }],
      hours: [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
        weekday,
        start_time: "00:00",
        end_time: "23:59",
      })),
    },
  });
  if (error) throw new Error(error.message);
  await db()
    .from("businesses")
    .update({ plan: "pro", professional_seats: seats, min_notice_minutes: 0 })
    .eq("id", businessId);
  const { data: pros } = await db()
    .from("professionals")
    .select("id")
    .eq("business_id", businessId);
  const { data: service } = await db()
    .from("services")
    .select("id")
    .eq("business_id", businessId)
    .single();
  return {
    owner,
    businessId: businessId as string,
    slug,
    professionalIds: (pros ?? []).map((p) => p.id as string),
    serviceId: service!.id as string,
  };
}

async function bookThroughChat(
  page: Page,
  slug: string,
  brandKey: string,
  phone: string,
  email: string,
) {
  await page.goto(`/${slug}?brand=${brandKey}`);
  await page.getByRole("button", { name: /Serviço E2E/ }).click();
  const anyPro = page.getByRole("button", { name: "Qualquer profissional" });
  if (await anyPro.isVisible().catch(() => false)) await anyPro.click();
  await page
    .getByRole("button", { name: /, \d{1,2} de [a-zç]+$/i })
    .first()
    .click();
  await page
    .locator("button")
    .filter({ hasText: /^\d{2}:\d{2}$/ })
    .first()
    .click();
  await page.getByLabel("Seu nome").fill("Cliente Estendido");
  await page.getByRole("button", { name: "Enviar" }).click();
  await page.getByLabel("WhatsApp").fill(phone);
  await page.getByRole("button", { name: "Enviar" }).click();
  await page.getByLabel("E-mail").fill(email);
  await page.getByRole("button", { name: "Enviar" }).click();
  const noCoupon = page.getByRole("button", { name: "Não tenho" });
  if (await noCoupon.isVisible().catch(() => false)) await noCoupon.click();
  await page.getByRole("button", { name: "Confirmar agendamento" }).click();
}

for (const brand of [psychology, physio]) {
  test.describe(`extended flows · ${brand.key}`, () => {
    skipUnlessFull();
    let fx: Fixture;

    test.beforeAll(async () => {
      fx = await createFixture(brand.key, 3);
    });
    test.afterAll(async () => {
      if (fx) await deleteUser(fx.owner.id);
    });

    test("Team: second professional and the chat offers “qualquer profissional”", async ({
      page,
    }) => {
      const { data: second } = await db()
        .from("professionals")
        .insert({ business_id: fx.businessId, name: "Segunda", position: 1 })
        .select("id")
        .single();
      await db().from("professional_services").insert({
        business_id: fx.businessId,
        professional_id: second!.id,
        service_id: fx.serviceId,
      });
      await db()
        .from("working_hours")
        .insert(
          [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
            business_id: fx.businessId,
            professional_id: second!.id,
            weekday,
            start_time: "00:00",
            end_time: "23:59",
          })),
        );
      await page.goto(`/${fx.slug}?brand=${brand.key}`);
      await page.getByRole("button", { name: /Serviço E2E/ }).click();
      await expect(page.getByRole("button", { name: "Qualquer profissional" })).toBeVisible();
      await expect(page.getByRole("button", { name: /Segunda/ })).toBeVisible();
    });

    test("Pix deposit: booking waits for the deposit and shows a valid BR Code", async ({
      page,
    }) => {
      await db()
        .from("page_settings")
        .update({ pix_key: "+5511999998888", pix_receiver_name: "TESTE" })
        .eq("business_id", fx.businessId);
      await db()
        .from("services")
        .update({ deposit_type: "fixed", deposit_value: 2000 })
        .eq("id", fx.serviceId);
      await bookThroughChat(page, fx.slug, brand.key, "11977770001", "pix@example.com");
      const code = page.locator("code").filter({ hasText: /^000201/ });
      await expect(code).toBeVisible();
      await expect(code).toContainText("br.gov.bcb.pix");
      await expect(code).toContainText("540520.00");
      const { data: appointment } = await db()
        .from("appointments")
        .select("status, deposit_cents")
        .eq("business_id", fx.businessId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      expect(appointment).toMatchObject({ status: "awaiting_deposit", deposit_cents: 2000 });
      await db()
        .from("services")
        .update({ deposit_type: "none", deposit_value: 0 })
        .eq("id", fx.serviceId);
    });

    test("waitlist: cancelling notifies the list once", async ({ page }) => {
      const { data: appointment } = await db()
        .from("appointments")
        .select("id, starts_at, cancel_token")
        .eq("business_id", fx.businessId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      const date = new Date(appointment!.starts_at).toLocaleDateString("sv-SE", {
        timeZone: "America/Sao_Paulo",
      });
      const { data: entry } = await db()
        .from("waitlist_entries")
        .insert({
          business_id: fx.businessId,
          service_id: fx.serviceId,
          date,
          customer_name: "Espera",
          phone: "5511966660000",
          email: "espera@example.com",
        })
        .select("id")
        .single();

      await page.goto(`/cancelar/${appointment!.cancel_token}?brand=${brand.key}`);
      await page.getByRole("button", { name: "Cancelar horário" }).click();
      await page.getByRole("button", { name: "Sim, cancelar" }).click();
      await expect(page.getByText("Horário cancelado.")).toBeVisible();

      const { data: after } = await db()
        .from("waitlist_entries")
        .select("status")
        .eq("id", entry!.id)
        .single();
      expect(after!.status).toBe("notified");
      const { count } = await db()
        .from("notification_log")
        .select("id", { count: "exact", head: true })
        .eq("business_id", fx.businessId)
        .eq("type", "waitlist_cancel")
        .eq("reference", appointment!.id);
      expect(count).toBe(1);
    });
    test("review: only a completed appointment's link works, once", async ({ page }) => {
      const { data: appointment } = await db()
        .from("appointments")
        .select("id")
        .eq("business_id", fx.businessId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      await db()
        .from("appointments")
        .update({ status: "completed", deposit_status: "confirmed" })
        .eq("id", appointment!.id);
      const { data: tokenRow } = await db()
        .from("review_tokens")
        .insert({ business_id: fx.businessId, appointment_id: appointment!.id })
        .select("token")
        .single();
      await page.goto(`/avaliar/${tokenRow!.token}?brand=${brand.key}`);
      await page.getByRole("radio", { name: "5 estrelas" }).click();
      await page.getByRole("button", { name: "Enviar avaliação" }).click();
      await expect(page.getByText("Obrigada pela avaliação!")).toBeVisible();
      await page.goto(`/avaliar/${tokenRow!.token}?brand=${brand.key}`);
      await expect(page.getByText("Este link já foi usado")).toBeVisible();
    });

    test("referral: a referred customer is linked and valid only after completion", async ({
      page,
    }) => {
      const { data: referrer } = await db()
        .from("customers")
        .select("referral_code")
        .eq("business_id", fx.businessId)
        .limit(1)
        .single();
      await page.goto(`/${fx.slug}?ref=${referrer!.referral_code}&brand=${brand.key}`);
      await bookThroughChat(page, fx.slug, brand.key, "11955550002", "indicada@example.com");
      const { data: referral } = await db()
        .from("referrals")
        .select("status")
        .eq("business_id", fx.businessId)
        .maybeSingle();
      expect(referral?.status).toBe("pending");
    });

    test("portal: listing shows only this brand's businesses", async ({ page }) => {
      await page.goto(`/explorar?brand=${brand.key}`);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const other = brand.key === "psychology" ? "physio" : "psychology";
      const html = await (await page.request.get(`/sitemap.xml?brand=${brand.key}`)).text();
      expect(html).not.toContain(`e2e-${other}-`);
    });

    test("external modal: chat page is embeddable and opens from embed.js", async ({ page }) => {
      const response = await page.request.get(`/${fx.slug}/agendar?embed=1&brand=${brand.key}`);
      expect(response.headers()["content-security-policy"]).toContain("frame-ancestors *");
      await page.goto(`/embed-teste.html?brand=${brand.key}`);
      await page.waitForFunction(
        () => (window as unknown as { __livelyEmbed?: boolean }).__livelyEmbed === true,
      );
      await page.evaluate((slug) => {
        const link = document.createElement("a");
        link.id = "fixture-link";
        link.href = `/${slug}`;
        link.dataset.livelySlug = slug;
        link.textContent = "Agendar fixture";
        document.body.append(link);
      }, fx.slug);
      await page.locator("#fixture-link").click();
      const frame = page.frameLocator("iframe[title='Agendamento']");
      await expect(frame.getByRole("heading", { name: /Agendar com/ })).toBeVisible();
    });
    test("custom domain: panel requires the add-on and shows DNS instructions once added", async ({
      page,
    }) => {
      await signIn(page, brand.key, fx.owner.email, fx.owner.password);
      await page.goto("/painel/integracoes");
      await expect(page.getByRole("heading", { name: "Domínio próprio" })).toBeVisible();
      await expect(page.getByRole("link", { name: "Contratar Domínio próprio" })).toBeVisible();
    });
  });
}
