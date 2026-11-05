import { expect, test, type Page } from "@playwright/test";

/** Custom site (2026-11-06): briefing, payment, production, delivery and the adjustment. */

async function setPlan(page: Page, business: string, label: "Teste do Completo" | "Assinante") {
  await page.goto("/demo#planos");
  await page
    .locator("#planos form", { hasText: business })
    .getByRole("button", { name: label, exact: true })
    .click();
  await page.waitForURL(/ok=plano/);
}

async function signIn(page: Page, email: string) {
  await page.goto("/demo");
  await page.locator("form", { hasText: email }).getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(/\/(painel|admin)/);
}

async function fillAndSendBriefing(page: Page) {
  await page.getByRole("button", { name: "Elegante", exact: true }).click();
  await page.getByRole("button", { name: "Antes e depois", exact: true }).click();
  await page
    .getByLabel(/Conte um pouco sobre você/)
    .fill("Consultório de psicologia, atendo adultos há 10 anos.");
  await page.getByRole("button", { name: "Enviar briefing" }).click();
  await expect(page.getByText(/Briefing recebido!|Seu site está em produção/)).toBeVisible();
}

async function adminStep(page: Page, business: string, button: RegExp, status: string) {
  await page.goto("/admin/sites");
  await page
    .getByRole("link", { name: new RegExp(business) })
    .first()
    .click();
  await page.waitForURL(/\/admin\/sites\/[0-9a-f-]{36}$/);
  await page.getByRole("button", { name: button }).click();
  await page.goto("/admin/sites");
  await expect(page.getByText(status, { exact: true }).first()).toBeVisible();
}

test("custom site: R$ 197 with the first month, then R$ 148 for a subscriber", async ({
  page,
  browser,
}) => {
  await setPlan(page, "Espaço Escuta", "Teste do Completo");
  await signIn(page, "psi@demo.com");

  // 1. Briefing, then the Pix with the first month of "Site + Agenda".
  await page.goto("/painel/site");
  await page.getByRole("link", { name: /Quer um site com a sua cara/ }).click();
  await page.waitForURL(/\/painel\/site\/personalizado/);
  await expect(page.getByText(/R\$ 197,00/).first()).toBeVisible();
  await page.getByRole("button", { name: "Enviar briefing" }).click();
  await expect(page.getByText(/Falta responder/)).toBeVisible();
  await fillAndSendBriefing(page);
  await page.getByLabel("Nome completo ou razão social").fill("Ana Souza");
  await page.getByLabel("CPF ou CNPJ").fill("529.982.247-25");
  await page.getByRole("button", { name: "Gerar Pix de R$ 197,00" }).click();
  await expect(page.getByRole("img", { name: "QR code do Pix" })).toBeVisible();

  // The payment arrives (simulated Asaas): in production, with the deadline.
  const demo = await page.context().newPage();
  await demo.goto("/demo#assinaturas");
  await demo
    .locator("form", { hasText: "Espaço Escuta" })
    .filter({ has: demo.getByRole("button", { name: "Confirmar pagamento" }) })
    .first()
    .getByRole("button", { name: "Confirmar pagamento" })
    .click();
  await expect(demo.getByText(/Pagamento confirmado/)).toBeVisible();
  await expect(page.getByText("Seu site está em produção")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(/Entrega até \d{2}\/\d{2}\/\d{4}/)).toBeVisible();

  // 2. Admin: the briefing to copy, then delivered.
  const adminContext = await browser.newContext();
  const admin = await adminContext.newPage();
  await signIn(admin, "admin@demo.com");
  await admin.goto("/admin/sites");
  await admin
    .getByRole("link", { name: /Espaço Escuta/ })
    .first()
    .click();
  await expect(admin.getByText(/SITE PERSONALIZADO: Espaço Escuta/)).toBeVisible();
  await expect(admin.getByRole("button", { name: "Copiar briefing" })).toBeVisible();
  await admin.getByRole("button", { name: /marcar como entregue/ }).click();
  await expect(admin.getByRole("button", { name: "Concluir sem ajuste" })).toBeVisible();

  // 3. Owner: delivered, one adjustment.
  await page.goto("/painel/site/personalizado");
  await expect(page.getByText("Seu site personalizado está no ar")).toBeVisible();
  await page.getByLabel("O que você quer mudar?").fill("Trocar a foto do topo por uma mais clara.");
  await page.getByRole("button", { name: "Pedir ajuste" }).click();
  await expect(page.getByText(/Ajuste pedido em/)).toBeVisible();
  await adminStep(admin, "Espaço Escuta", /Ajuste publicado: concluir/, "Concluído");

  // 4. Now a "Site + Agenda" subscriber: a new custom site is R$ 148, a one-off Pix.
  await page.goto("/painel/site/personalizado");
  await expect(page.getByText(/R\$ 148,00/).first()).toBeVisible();
  await fillAndSendBriefing(page);
  await page.getByRole("button", { name: "Gerar Pix de R$ 148,00" }).click();
  await expect(page.getByRole("img", { name: "QR code do Pix" })).toBeVisible();
  await demo.goto("/demo#assinaturas");
  await demo
    .locator("form", { hasText: "Espaço Escuta" })
    .filter({ has: demo.getByRole("button", { name: "Confirmar Pix avulso" }) })
    .getByRole("button", { name: "Confirmar Pix avulso" })
    .click();
  await expect(page.getByText("Seu site está em produção")).toBeVisible({ timeout: 20_000 });
  await adminStep(admin, "Espaço Escuta", /Cancelar pedido/, "Concluído");
  await adminContext.close();
});
