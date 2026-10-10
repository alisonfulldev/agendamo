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
  await expect(page.getByRole("link", { name: "Psicologia", exact: true })).toHaveAttribute(
    "href",
    `/${psychology.niche.route}`,
  );
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
    // The top is the chat with the niche's own example; calls to action lead to its name field.
    await expect(
      page.getByText(new RegExp(`Você está na agenda de ${heroDemoFor(brand).business}`)),
    ).toBeVisible();
    await page.getByRole("link", { name: "Criar meu link grátis" }).first().click();
    await expect(page.getByLabel("Nome do negócio")).toBeFocused();
  });
}

test("generic home: “Criar meu link grátis” leads to the name question of the top chat", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: HOME.hero.primaryCta }).first().click();
  await expect(page.getByLabel("Nome do negócio")).toBeFocused();
  await expect(page.getByText(/Qual o nome dele\?/)).toBeVisible();
});

test("?criar=1 opens the creation conversation right in the top chat", async ({ page }) => {
  await page.goto("/?criar=1");
  await expect(page.locator("[data-creation]")).toBeVisible();
  await expect(page.getByLabel("Nome do negócio")).toBeVisible();
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
