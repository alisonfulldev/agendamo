import { expect, test, type Page } from "@playwright/test";

import { barber } from "../src/brands/barber";
import { beauty } from "../src/brands/beauty";

const brandVar = (page: Page, name: string) =>
  page.evaluate((n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim(), name);

for (const brand of [beauty, barber]) {
  test(`?brand=${brand.key} shows that brand's name, colors and copy`, async ({ page }) => {
    await page.goto(`/?brand=${brand.key}`);

    await expect(page.locator("html")).toHaveAttribute("data-brand", brand.key);
    await expect(page).toHaveTitle(new RegExp(brand.name));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(brand.sales.title);
    await expect(page.getByRole("banner")).toContainText(brand.name);
    expect(await brandVar(page, "--brand-primary")).toBe(brand.theme.primary);
    await expect(page.locator('link[rel="icon"]')).toHaveAttribute(
      "href",
      new RegExp(brand.favicon),
    );
  });
}

test("switching brands leaves nothing from the previous one", async ({ page }) => {
  await page.goto("/?brand=beauty");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(beauty.sales.title);

  await page.goto("/?brand=barber");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(barber.sales.title);

  // No param: the cookie keeps barber, and nothing from beauty is rendered.
  const response = await page.goto("/");
  const html = (await response?.text()) ?? "";
  expect(html).toContain(barber.sales.title);
  expect(html).not.toContain(beauty.name);
  expect(html).not.toContain(beauty.sales.title);
  expect(html).not.toContain(beauty.theme.primary);
  expect(await brandVar(page, "--brand-primary")).toBe(barber.theme.primary);

  // And back again.
  await page.goto("/?brand=beauty");
  await expect(page.locator("html")).toHaveAttribute("data-brand", "beauty");
  expect(await page.content()).not.toContain(barber.sales.title);
});

test("client-side navigation to another ?brand= switches the whole page", async ({ page }) => {
  await page.goto("/?brand=barber");
  await expect(page.locator("html")).toHaveAttribute("data-brand", "barber");

  // Soft navigation through the App Router (window.nd is exposed by `next dev`).
  await page.waitForFunction(() => "nd" in window);
  await page.evaluate(() =>
    (window as unknown as { nd: { router: { push: (url: string) => void } } }).nd.router.push(
      "/?brand=beauty",
    ),
  );

  await expect(page.getByRole("heading", { level: 1 })).toHaveText(beauty.sales.title);
  await expect(page.locator("html")).toHaveAttribute("data-brand", "beauty");
  await expect(page.getByRole("banner")).toContainText(beauty.name);
  expect(await brandVar(page, "--brand-primary")).toBe(beauty.theme.primary);
});

test("home links to /entrar and /cadastro do not 404", async ({ page }) => {
  for (const [name, path] of [
    ["Entrar", "/entrar"],
    ["Testar 30 dias grátis", "/cadastro"],
  ] as const) {
    await page.goto("/?brand=barber");
    await page.getByRole("link", { name }).first().click();
    await expect(page).toHaveURL(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("data-brand", "barber");
  }
});

test("a client-sent x-brand header is ignored", async ({ request }) => {
  const response = await request.get("/?brand=barber", { headers: { "x-brand": "beauty" } });
  const html = await response.text();
  expect(html).toContain(barber.sales.title);
  expect(html).not.toContain(beauty.sales.title);
});
