import { expect, test } from "@playwright/test";

/** "Site ou Loja" (2026-11-07): public store and site, and the reduced panel. */

const SHOTS = process.env.WEB_SHOTS_DIR;

test("store: catalog, bag and the order on the WhatsApp", async ({ page }) => {
  await page.goto("/bela-cosmeticos");
  // The title may have been edited by the panel test (it changes the demo store).
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/store-desktop.png`, fullPage: true });
  await page.getByRole("button", { name: "Esmaltes", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Paleta de sombras" })).toHaveCount(0);
  await page.getByRole("button", { name: "Tudo" }).click();
  const kit = page.locator("li", { has: page.getByRole("heading", { name: "Kit 6 esmaltes nude" }) });
  await kit.getByRole("button", { name: "Adicionar" }).click();
  await kit.getByRole("button", { name: /Mais um/ }).click();
  const oil = page.locator("li", { has: page.getByRole("heading", { name: "Óleo de cutícula" }) });
  await oil.getByRole("button", { name: "Adicionar" }).click();
  await page.getByRole("button", { name: /Sacolinha \(3\)/ }).click();
  await expect(page.getByRole("dialog")).toContainText("R$ 204,70");
  const order = page.getByRole("link", { name: "Enviar pedido no WhatsApp" });
  const href = decodeURIComponent((await order.getAttribute("href")) ?? "");
  expect(href).toContain("wa.me/5548999990010");
  expect(href).toContain("2× Kit 6 esmaltes nude");
  expect(href).toContain("Total: R$ 204,70");
});

test("site: big template, every button opens the WhatsApp", async ({ page }) => {
  await page.goto("/silva-costa-advocacia");
  await expect(
    page.getByRole("heading", { level: 1, name: "Silva & Costa Advocacia" }),
  ).toBeVisible();
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/site-desktop.png`, fullPage: true });
  await expect(page.getByRole("heading", { name: "Direito trabalhista" })).toBeVisible();
  const ask = page.getByRole("link", { name: "Quero saber mais" }).first();
  expect(decodeURIComponent((await ask.getAttribute("href")) ?? "")).toContain(
    "quero saber mais sobre: Direito trabalhista",
  );
  // The old booking addresses lead to the site.
  await page.goto("/silva-costa-advocacia/site");
  await expect(page).toHaveURL(/\/silva-costa-advocacia$/);
});

test("phone: store and site at 390 px", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto("/bela-cosmeticos");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/store-phone.png`, fullPage: true });
  await page.goto("/silva-costa-advocacia");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/site-phone.png`, fullPage: true });
  await context.close();
});

test("panel: only the site, its products, subscription and account", async ({ page }) => {
  await page.goto("/demo");
  await page
    .locator("form", { hasText: "loja@demo.com" })
    .getByRole("button", { name: "Entrar" })
    .click();
  await page.waitForURL(/\/painel/);
  await page.goto("/painel");
  await expect(page).toHaveURL(/\/painel\/web$/);
  await expect(page.getByText("O link da sua loja")).toBeVisible();
  // Booking screens are not there.
  await page.goto("/painel/agenda");
  await expect(page).toHaveURL(/\/painel\/web$/);

  await page.goto("/painel/web/catalogo");
  await expect(page.getByText("Kit 6 esmaltes nude")).toBeVisible();
  const name = `Batom ${Date.now().toString(36)}`;
  await page.getByRole("button", { name: "Adicionar produto" }).click();
  await page.getByLabel("Nome").fill(name);
  await page.getByLabel(/Preço/).fill("39,90");
  await page.getByLabel(/Categoria/).fill("Maquiagem");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByRole("button", { name: "Enviar foto" })).toBeVisible();

  await page.goto("/bela-cosmeticos");
  await expect(page.getByRole("heading", { name })).toBeVisible();

  await page.goto("/painel/web/site");
  await page.getByLabel("Título do topo").fill("Tudo para suas unhas");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText("Site atualizado. Já está no ar.")).toBeVisible();
  await page.goto("/bela-cosmeticos");
  await expect(
    page.getByRole("heading", { level: 1, name: "Tudo para suas unhas" }),
  ).toBeVisible();
});
