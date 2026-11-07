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
  const kit = page.locator("li", {
    has: page.getByRole("heading", { name: "Kit 6 esmaltes nude" }),
  });
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
  await expect(page.getByRole("heading", { level: 1, name: "Tudo para suas unhas" })).toBeVisible();
});

test("sales chat (/criar-site): store with her name, custom offer, Pix and the panel", async ({
  page,
  browser,
}) => {
  const stamp = Date.now().toString(36);
  const name = `Loja ${stamp}`;
  const email = `loja-${stamp}@exemplo.com`;

  const visitor = await browser.newContext();
  const chat = await visitor.newPage();
  await chat.goto("/criar-site");
  await expect(chat.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await chat.getByRole("button", { name: "Uma loja com catálogo" }).click();
  await chat.getByPlaceholder("Nome do seu negócio").fill(name);
  await chat.keyboard.press("Enter");

  // The template opens over the chat, with her name, and comes back.
  await chat.getByRole("button", { name: /Vitrine.*Ver/ }).click();
  const frame = chat.frameLocator('iframe[title="Prévia do site"]');
  await expect(frame.getByRole("heading", { level: 1, name })).toBeVisible();
  await chat.getByRole("button", { name: "Voltar para a conversa" }).click();

  // "Não gostei de nenhum" offers the custom site; she goes back to the templates.
  await chat.getByRole("button", { name: "Não gostei de nenhum" }).click();
  await expect(chat.getByText(/a partir de R\$ 197,00/)).toBeVisible();
  await chat.getByRole("button", { name: "Prefiro um dos modelos" }).click();
  await chat.getByRole("button", { name: "Vitrine", exact: true }).click();
  // The end of the tour: her store is ready as a preview; publishing is the plan.
  await expect(chat.getByText(/A base da sua loja está pronta!/)).toBeVisible();
  await chat.getByRole("button", { name: "Ver minha loja" }).click();
  await expect(frame.getByText(/Prévia da sua loja/)).toBeVisible();
  await chat.getByRole("button", { name: "Voltar para a conversa" }).click();
  await chat.getByRole("button", { name: "Publicar minha loja" }).click();
  await chat.getByRole("button", { name: /Mensal/ }).click();
  await chat.getByPlaceholder("Nome completo").fill("Maria Loja Teste");
  await chat.keyboard.press("Enter");
  await chat.getByPlaceholder("seuemail@exemplo.com").fill(email);
  await chat.keyboard.press("Enter");
  await chat.getByPlaceholder("(11) 99999-9999").fill("11988887777");
  await chat.keyboard.press("Enter");
  await chat.getByPlaceholder("CPF ou CNPJ").fill("529.982.247-25");
  await chat.keyboard.press("Enter");
  await expect(chat.getByText(/Loja · R\$ 29,00\/mês/)).toBeVisible();
  await chat.getByRole("button", { name: "Gerar meu Pix" }).click();
  await expect(chat.getByRole("img", { name: "QR code do Pix" })).toBeVisible({ timeout: 20_000 });

  // The Asaas webhook confirms the payment (simulated in demo mode).
  await page.goto("/demo#assinaturas");
  await page
    .locator("form", { hasText: name })
    .filter({ has: page.getByRole("button", { name: "Confirmar pagamento" }) })
    .first()
    .getByRole("button", { name: "Confirmar pagamento" })
    .click();
  await expect(page.getByText(/Pagamento confirmado: a assinatura foi ativada/)).toBeVisible();

  await expect(chat.getByText(/Sua loja já está no ar/)).toBeVisible({ timeout: 20_000 });
  await expect(chat.getByText(/R\$ 120,00 por ano/)).toBeVisible();
  await chat.getByRole("button", { name: "Entrar no painel" }).click();
  await chat.waitForURL(/\/painel\/web/);
  await expect(chat.getByText("O link da sua loja")).toBeVisible();
  await visitor.close();
});

test("site preview follows her niche: a tattoo studio sees tattoo services in its colors", async ({
  page,
}) => {
  await page.goto("/criar-site");
  await page.getByRole("button", { name: "Um site para o meu negócio" }).click();
  await page.getByPlaceholder("Nome do seu negócio").fill("Tinta Tattoo Studio");
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Sim", exact: true }).click();
  await page.getByRole("button", { name: /Impacto.*Ver/ }).click();
  const frame = page.frameLocator('iframe[title="Prévia do site"]');
  await expect(frame.getByRole("heading", { level: 1, name: "Tinta Tattoo Studio" })).toBeVisible();
  await expect(frame.getByRole("heading", { name: "Sessão de tatuagem" })).toBeVisible();
});
