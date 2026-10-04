import { expect, test, type Page } from "@playwright/test";

import { barber } from "../src/brands/barber";
import { beauty } from "../src/brands/beauty";
import { platform } from "../src/brands/platform";

const scopedVar = (page: Page, name: string) =>
  page.evaluate(
    (n) =>
      getComputedStyle(document.querySelector("[data-theme-scope]") ?? document.documentElement)
        .getPropertyValue(n)
        .trim(),
    name,
  );

test("the home is the generic Agendamo page, whatever brand the cookie remembers", async ({
  page,
}) => {
  await page.goto("/?brand=barber");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(platform.sales.title);
  await expect(page.getByRole("banner")).toContainText("Agendamo");
  expect(await scopedVar(page, "--brand-primary")).toBe(platform.theme.primary);
  for (const label of [beauty.niche.label, barber.niche.label]) {
    await expect(page.getByRole("heading", { name: label })).toBeVisible();
  }
  const html = await (await page.request.get("/")).text();
  expect(html).not.toContain(barber.sales.title);
});

for (const brand of [beauty, barber]) {
  test(`/${brand.niche.route} shows the ${brand.key} niche: copy, colors and its sign-up`, async ({
    page,
  }) => {
    await page.goto(`/${brand.niche.route}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(brand.sales.title);
    await expect(page.getByRole("banner")).toContainText(`para ${brand.niche.name.toLowerCase()}`);
    expect(await scopedVar(page, "--brand-primary")).toBe(brand.theme.primary);

    await page.getByRole("link", { name: "Testar 30 dias grátis" }).first().click();
    await expect(page).toHaveURL(new RegExp(`/cadastro\\?brand=${brand.key}`));
    await expect(page.locator("html")).toHaveAttribute("data-brand", brand.key);
  });
}

test("generic home: “Testar grátis” asks for the niche, then signs up in it", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Testar 30 dias grátis" }).first().click();
  await expect(page).toHaveURL(/\/comecar/);
  await page.getByRole("link", { name: new RegExp(barber.niche.label) }).click();
  await expect(page).toHaveURL(/\/cadastro\?brand=barber/);
  await expect(page.locator("html")).toHaveAttribute("data-brand", "barber");
});

test("niche pages switch fully between each other", async ({ page }) => {
  await page.goto(`/${beauty.niche.route}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(beauty.sales.title);
  const response = await page.goto(`/${barber.niche.route}`);
  const html = (await response?.text()) ?? "";
  expect(html).toContain(barber.sales.title);
  expect(html).not.toContain(beauty.sales.title);
  expect(await scopedVar(page, "--brand-primary")).toBe(barber.theme.primary);
});

test("a client-sent x-brand header is ignored", async ({ request }) => {
  const response = await request.get("/cadastro?brand=barber", {
    headers: { "x-brand": "beauty" },
  });
  expect(await response.text()).toContain('data-brand="barber"');
});
