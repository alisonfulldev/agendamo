import { expect, test } from "@playwright/test";

import { HOME } from "../src/content/home";

test("home page: sales sections, current price and the main call to action", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(HOME.hero.title);
  await expect(page.getByText(HOME.hero.note)).toBeVisible();
  for (const title of [HOME.pains.title, HOME.steps.title, HOME.gains.title, HOME.faq.title]) {
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
  }
  await expect(page.getByText("R$ 19", { exact: true })).toBeVisible();
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

test("reduced motion: the phone shows the finished booking, still", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/");
  const phone = page.getByRole("img", { name: /Exemplo:/ });
  await expect(phone).toContainText("Prontinho");
  await expect(phone).toContainText("Novo agendamento");
  await context.close();
});
