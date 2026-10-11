import { expect, test } from "@playwright/test";

import { HOME } from "../src/content/home";

test("home page: SEO texts, sections in order, current prices and one main button", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Agendamento online grátis pelo link da bio | MeetChat");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    HOME.meta.description,
  );
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(HOME.hero.title);
  const h2 = await page.getByRole("heading", { level: 2 }).allTextContents();
  const order = [
    HOME.audience.title,
    "Como funciona o agendamento online",
    "Agendamento pelo Instagram e WhatsApp",
    "Lembrete automático para o cliente não faltar",
    "Preços",
    "Perguntas frequentes",
  ].map((title) => h2.indexOf(title));
  expect(order.every((i) => i >= 0)).toBe(true);
  expect([...order].sort((a, b) => a - b)).toEqual(order);
  await expect(page.getByText("Quanto tempo você perde")).toHaveCount(0);
  await expect(page.getByText("R$ 29,90", { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/R\$ 24,90\/mês no anual/).first()).toBeVisible();
  await expect(page.getByText("R$ 19,90")).toHaveCount(0);
  await expect(page.getByText("30 dias grátis")).toHaveCount(0);
  // Every niche page is linked from the home.
  await expect(page.locator('a[href="/barbearia"]').first()).toBeAttached();
  await expect(page.locator('a[href="/terapia-ocupacional"]')).toBeAttached();
});

test("structured data: Organization, SoftwareApplication with the plan and FAQPage", async ({
  page,
}) => {
  await page.goto("/");
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  const items = blocks.flatMap((b) => JSON.parse(b) as Record<string, unknown>[]);
  const types = items.map((i) => i["@type"]);
  expect(types).toEqual(expect.arrayContaining(["Organization", "SoftwareApplication", "FAQPage"]));
  const app = items.find((i) => i["@type"] === "SoftwareApplication")!;
  expect(app.applicationCategory).toBe("BusinessApplication");
  expect((app.offers as { price: string }[]).map((o) => o.price)).toEqual(["29.90"]);
  const faq = items.find((i) => i["@type"] === "FAQPage")!;
  expect((faq.mainEntity as unknown[]).length).toBe(HOME.faq.items.length);
});

test("phone 390x844: the first screen shows the whole top and the start of the phone", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const inView = async (locator: ReturnType<typeof page.locator>) => {
    const box = (await locator.boundingBox())!;
    return box.y >= 0 && box.y + box.height <= 844;
  };
  expect(await inView(page.getByText(HOME.hero.eyebrow, { exact: true }))).toBe(true);
  expect(await inView(page.getByRole("heading", { level: 1 }))).toBe(true);
  expect(await inView(page.getByText(HOME.hero.subtitle))).toBe(true);
  const cta = page.locator("#cta-topo a");
  expect(await inView(cta)).toBe(true);
  expect((await cta.boundingBox())!.height).toBeGreaterThanOrEqual(52);
  expect(await inView(page.getByText(HOME.hero.note).first())).toBe(true);
  expect(await inView(page.getByRole("link", { name: "Ver como funciona" }))).toBe(true);
  const phone = (await page.getByRole("group", { name: /Exemplo:/ }).boundingBox())!;
  expect(phone.y).toBeLessThan(844);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});

test("demo: in order, ending on the notification, without MeetChat balloons, emojis or dates", async ({
  page,
}) => {
  await page.goto("/");
  const phone = page.getByRole("group", { name: /Exemplo:/ });
  // Never empty: the first balloon comes from the server.
  await expect(phone.getByText("Olá! Qual serviço você quer agendar?")).toBeVisible();
  await expect(phone.getByText("Studio Lumi")).toBeVisible();
  await expect(phone.getByText("Agendamento 24h")).toBeVisible();
  await expect(phone.getByText("Novo agendamento: Ana, sábado 10h")).toBeVisible({
    timeout: 10_000,
  });
  const text = await phone.innerText();
  const order = [
    "Olá! Qual serviço você quer agendar?",
    "Design de sobrancelha",
    "Qual dia fica melhor?",
    "Sábado, 10h",
    "Pronto, Ana! Horário confirmado para sábado às 10h.",
  ].map((t) => text.indexOf(t));
  expect(order.every((i) => i >= 0)).toBe(true);
  expect(text).not.toMatch(/\d{1,2}\/\d{1,2}/);
  expect(text).not.toMatch(/\p{Extended_Pictographic}/u);
  expect(text).not.toMatch(/Qual o nome/);
  await expect(phone.getByRole("button", { name: "Ver de novo" })).toBeVisible();
});

test("phone: the bottom bar shows up only after the top button leaves the screen, never over the closing button", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const sticky = page.locator("div.fixed.bottom-0");
  await expect(sticky).toHaveAttribute("aria-hidden", "true");
  await page.getByRole("heading", { name: HOME.pricing.title }).scrollIntoViewIfNeeded();
  await expect(sticky).toHaveAttribute("aria-hidden", "false");
  // Never over the closing button.
  await page.getByRole("heading", { name: HOME.closing.title }).scrollIntoViewIfNeeded();
  await expect(sticky).toHaveAttribute("aria-hidden", "true");
});

test("reduced motion: the whole conversation and the notification, still", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/");
  const phone = page.getByRole("group", { name: /Exemplo:/ });
  await expect(
    phone.getByText("Pronto, Ana! Horário confirmado para sábado às 10h."),
  ).toBeVisible();
  await expect(phone.getByText("Novo agendamento: Ana, sábado 10h")).toBeVisible();
  await context.close();
});

test("A/B test: ?v=b shows the other title and button", async ({ page }) => {
  await page.goto("/?v=b");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(HOME.hero.variantB!.title);
  await expect(page.locator("#cta-topo a")).toHaveText(HOME.hero.variantB!.primaryCta);
});
