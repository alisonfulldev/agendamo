import { expect, test } from "@playwright/test";

import { HOME } from "../src/content/home";

test("home page: sales sections, current price and the main call to action", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(HOME.hero.title);
  await expect(page.getByText(HOME.hero.note).first()).toBeVisible();
  for (const title of [HOME.pains.title, HOME.steps.title, HOME.gains.title, HOME.faq.title]) {
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
  }
  // The three plans, with the current prices.
  for (const price of ["R$ 0", "R$ 19,90", "R$ 39,90"]) {
    await expect(page.getByText(price, { exact: true }).first()).toBeVisible();
  }
  await expect(page.getByText("30 dias grátis")).toHaveCount(0);
  await expect(page.getByText(HOME.pricing.tagline)).toBeVisible();
  await expect(page.getByRole("link", { name: HOME.hero.primaryCta }).first()).toHaveAttribute(
    "href",
    "?criar=1",
  );
});

test("phone: the call to action stays fixed at the bottom after the top", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const sticky = page.locator("div.fixed.bottom-0");
  await expect(sticky).toHaveAttribute("aria-hidden", "true");
  await page.getByRole("heading", { name: HOME.faq.title }).scrollIntoViewIfNeeded();
  await expect(sticky).toHaveAttribute("aria-hidden", "false");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});

test("reduced motion: the top chat shows the whole conversation, still", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.getByText("Pronto! Horário confirmado.", { exact: false })).toBeVisible();
  await expect(page.getByText(/Novo agendamento: Ana, sábado 10h/)).toBeVisible();
  await expect(page.getByText(/Qual o nome dele\?/)).toBeVisible();
  await context.close();
});
