import { expect, test } from "@playwright/test";

import { HOME_LANDING } from "../src/content/copy/landing";
import { HOME } from "../src/content/home";

// Bucket 0 = control of every headline experiment (docs/design/experiments.md).
test.beforeEach(async ({ context, baseURL }) => {
  await context.addCookies([{ name: "mc_ab", value: "0", url: baseURL! }]);
});

test("home: SEO texts, one H1, sections in order, no price values and every niche linked", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page).toHaveTitle(HOME.meta.title);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    HOME.meta.description,
  );
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(HOME_LANDING.hero.title);
  const h2 = await page.getByRole("heading", { level: 2 }).allTextContents();
  const order = [
    HOME_LANDING.doors!.title,
    HOME_LANDING.story.title,
    HOME_LANDING.compare.title,
    "Feito para quem trabalha com hora marcada",
    HOME_LANDING.objections.title,
    HOME.faq.title,
    HOME_LANDING.closing.title,
  ].map((title) => h2.indexOf(title));
  expect(order.every((i) => i >= 0)).toBe(true);
  expect([...order].sort((a, b) => a - b)).toEqual(order);
  // D1: no price values on the home (only on /precos), "grátis" always with its limit.
  const text = (await page.locator("body").textContent()) ?? "";
  expect(text).not.toMatch(/R\$\s?\d/);
  expect(text).not.toMatch(/para sempre/i);
  await expect(page.getByText(HOME_LANDING.hero.note).first()).toBeVisible();
  await expect(page.locator('a[href="/precos"]').first()).toBeAttached();
  // Every niche page is linked from the home.
  await expect(page.locator('a[href="/barbearia"]').first()).toBeAttached();
  await expect(page.locator('a[href="/terapia-ocupacional"]').first()).toBeAttached();
});

test("structured data: Organization, WebSite, SoftwareApplication with both offers, FAQPage", async ({
  page,
}) => {
  await page.goto("/");
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  const items = blocks.flatMap(
    (b) => (JSON.parse(b) as { "@graph": Record<string, unknown>[] })["@graph"],
  );
  const types = items.map((i) => i["@type"]);
  expect(types).toEqual(
    expect.arrayContaining(["Organization", "WebSite", "SoftwareApplication", "FAQPage"]),
  );
  const app = items.find((i) => i["@type"] === "SoftwareApplication")!;
  expect((app.offers as unknown[]).length).toBe(2);
  const faq = items.find((i) => i["@type"] === "FAQPage")!;
  expect((faq.mainEntity as unknown[]).length).toBe(HOME.faq.items.length);
});

test("phone 390x844: title, CTA and the start of the phone in the first screen, no sideways scroll", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const inView = async (locator: ReturnType<typeof page.locator>) => {
    const box = (await locator.boundingBox())!;
    return box.y >= 0 && box.y + box.height <= 844;
  };
  expect(await inView(page.getByRole("heading", { level: 1 }))).toBe(true);
  const cta = page.locator("#cta-topo a");
  expect(await inView(cta)).toBe(true);
  expect((await cta.boundingBox())!.height).toBeGreaterThanOrEqual(52);
  const phone = (await page.getByRole("group", { name: /Exemplo de agendamento/ }).boundingBox())!;
  expect(phone.y).toBeLessThan(844);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});

test("phone mock: answers to taps from service to the confirmation", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/");
  const phone = page.getByRole("group", { name: /Exemplo de agendamento/ });
  // Rendered by the server: there before any JavaScript runs.
  await expect(phone.getByText(/Qual serviço você quer agendar\?/)).toBeVisible();
  const [first] = HOME_LANDING.mock.services;
  await phone.getByRole("button", { name: new RegExp(first!.name) }).click();
  await phone.getByRole("button", { name: HOME_LANDING.mock.professionals[1]! }).click();
  await phone.getByRole("button", { name: "Sábado" }).click();
  await phone.getByRole("button", { name: "18:30" }).click();
  await expect(phone.getByText("Horário confirmado")).toBeVisible();
  await expect(phone.getByRole("button", { name: "Ver de novo" })).toBeVisible();
  await context.close();
});

test("phone: the bottom bar shows up only after the top button leaves the screen, never over the closing button", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const sticky = page.locator("div.fixed.bottom-0");
  await expect(sticky).toHaveAttribute("aria-hidden", "true");
  await page.getByRole("heading", { name: HOME_LANDING.compare.title }).scrollIntoViewIfNeeded();
  await expect(sticky).toHaveAttribute("aria-hidden", "false");
  await page.getByRole("heading", { name: HOME_LANDING.closing.title }).scrollIntoViewIfNeeded();
  await expect(sticky).toHaveAttribute("aria-hidden", "true");
});
