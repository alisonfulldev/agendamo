import { expect, test, type Page } from "@playwright/test";

import { physio } from "../src/brands/physio";
import { psychology } from "../src/brands/psychology";
import { platform } from "../src/brands/platform";
import { HOME } from "../src/content/home";
import { heroDemoFor } from "../src/content/hero-demo";
import { nicheHomeContent } from "../src/content/niche-pages";

const h1 = (brand: Parameters<typeof nicheHomeContent>[0]) => nicheHomeContent(brand).hero.title;

const scopedVar = (page: Page, name: string) =>
  page.evaluate(
    (n) =>
      getComputedStyle(document.querySelector("[data-theme-scope]") ?? document.documentElement)
        .getPropertyValue(n)
        .trim(),
    name,
  );

test("the home is the generic MeetChat page, whatever brand the cookie remembers", async ({
  page,
}) => {
  await page.goto("/?brand=physio");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(HOME.hero.title);
  await expect(page.getByRole("banner")).toContainText("MeetChat");
  expect(await scopedVar(page, "--brand-primary")).toBe(platform.theme.primary);
  // Chips lead to the niche pages.
  await expect(
    page.getByRole("main").getByRole("link", { name: "Psicologia", exact: true }),
  ).toHaveAttribute("href", `/${psychology.niche.route}`);
  const html = await (await page.request.get("/")).text();
  expect(html).not.toContain(physio.sales.title);
});

for (const brand of [psychology, physio]) {
  test(`/${brand.niche.route} is a sales page made for the ${brand.key} niche`, async ({
    page,
  }) => {
    await page.goto(`/${brand.niche.route}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(h1(brand));
    await expect(page.getByRole("banner")).toContainText(brand.niche.name);
    expect(await scopedVar(page, "--brand-primary")).toBe(brand.theme.primary);
    await expect(page).toHaveTitle(nicheHomeContent(brand).meta.title);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      new RegExp(`/${brand.niche.route}$`),
    );
    // The phone plays the niche's own example; internal links to the home and /precos.
    await expect(
      page.getByRole("group", { name: /Exemplo:/ }).getByText(heroDemoFor(brand).business),
    ).toBeVisible();
    await expect(page.locator('a[href="/precos"]').first()).toBeAttached();
    await expect(page.locator('header a[href="/"]')).toBeAttached();
    // The main button opens the creation conversation with the niche already chosen.
    await page.locator("#cta-topo a").click();
    await expect(page).toHaveURL(new RegExp(`criar=1&ramo=${brand.niche.route}`));
    await expect(page.locator("[data-creation]")).toBeVisible();
  });
}

test("generic home: the main button opens the creation conversation at the business name", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#cta-topo a").click();
  await expect(page).toHaveURL(/\?criar=1/);
  const chat = page.locator("[data-creation]");
  await expect(chat.getByText("Qual o nome do seu negócio?")).toBeVisible();
  await expect(chat.getByLabel("Nome do negócio")).toBeVisible();
});

test("?criar=1 opens the creation conversation over the page", async ({ page }) => {
  await page.goto("/?criar=1");
  await expect(page.locator('[role="dialog"] [data-creation]')).toBeVisible();
  await expect(page.getByLabel("Nome do negócio").last()).toBeVisible();
});

test("/comecar still lets you pick the niche and sign up in it", async ({ page }) => {
  await page.goto("/comecar");
  await page.getByRole("link", { name: new RegExp(physio.niche.label) }).click();
  await expect(page).toHaveURL(/\/cadastro\?brand=physio/);
  await expect(page.locator("html")).toHaveAttribute("data-brand", "physio");
});

test("niche pages switch fully between each other", async ({ page }) => {
  await page.goto(`/${psychology.niche.route}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(h1(psychology));
  const response = await page.goto(`/${physio.niche.route}`);
  const html = (await response?.text()) ?? "";
  expect(html).toContain(h1(physio));
  expect(html).not.toContain(h1(psychology));
  expect(await scopedVar(page, "--brand-primary")).toBe(physio.theme.primary);
});

test("a client-sent x-brand header is ignored", async ({ request }) => {
  const response = await request.get("/cadastro?brand=physio", {
    headers: { "x-brand": "psychology" },
  });
  expect(await response.text()).toContain('data-brand="physio"');
});
