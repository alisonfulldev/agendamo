import { readFileSync } from "node:fs";
import path from "node:path";

import { expect, test } from "@playwright/test";

/** WhatsApp sales (2026-11-06): example sites, Nova venda, payment page and release on payment. */

const EMAILS = path.join(process.cwd(), ".demo-data", "emails.json");
const subjectsTo = (to: string): string[] => {
  try {
    const all = JSON.parse(readFileSync(EMAILS, "utf8")) as { to: string[]; subject: string }[];
    return all.filter((e) => e.to.includes(to)).map((e) => e.subject);
  } catch {
    return [];
  }
};

test("example sites: both templates, out of search engines, booking opens the simulation", async ({
  page,
}) => {
  await page.goto("/exemplo/beleza");
  await expect(page.getByText("Site de exemplo · Modelo Vibrante")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Studio Bela" })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await page.getByRole("link", { name: "Ver modelo Elegante" }).click();
  await expect(page.getByText("Site de exemplo · Modelo Elegante")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Studio Bela" })).toBeVisible();
  // Gallery of the niche (example photos).
  await expect(page.getByRole("heading", { name: "Nossos trabalhos" })).toBeVisible();
  await expect(page.getByRole("img", { name: /Studio Bela: foto/ })).toHaveCount(6);
  // "Agendar" opens an example booking chat: nothing is booked.
  await page
    .getByRole("link", { name: /Agendar horário/ })
    .first()
    .click();
  await page.waitForURL(/\/exemplo\/beleza\/agendar\?modelo=elegante/);
  await expect(page.getByText("Exemplo: nada aqui é agendado de verdade.")).toBeVisible();
  await page.getByRole("button", { name: /^Manicure/ }).click();
  await page
    .getByRole("button", { name: /\d+ de / })
    .first()
    .click();
  await page.getByRole("button", { name: "14:00" }).click();
  await page.getByPlaceholder("Digite seu nome").fill("Mariana");
  await page.keyboard.press("Enter");
  await expect(page.getByText(/nenhum horário foi marcado/)).toBeVisible();
  await page.getByRole("link", { name: "Voltar ao site" }).click();
  await page.waitForURL(/\/exemplo\/beleza\?modelo=elegante$/);
});

test("Nova venda: account and Pix, payment page, paid releases the account and the site", async ({
  page,
  browser,
}) => {
  const stamp = Date.now().toString(36);
  const name = `Venda ${stamp}`;
  const email = `venda-${stamp}@exemplo.com`;

  await page.goto("/demo");
  await page
    .locator("form", { hasText: "admin@demo.com" })
    .getByRole("button", { name: "Entrar" })
    .click();
  await page.waitForURL(/\/admin/);
  await page.goto("/admin/vendas");
  await page.getByLabel("Nome do negócio").fill(name);
  await page.getByLabel("Ramo").selectOption("beauty");
  await page.getByLabel(/Nome completo/).fill("Maria Venda Teste");
  await page.getByLabel("CPF ou CNPJ").fill("529.982.247-25");
  await page.getByLabel(/E-mail/).fill(email);
  await page.getByLabel("WhatsApp").fill("(11) 98888-7777");
  await page.getByLabel("Elegante").check();
  await page.getByRole("button", { name: "Criar conta e gerar Pix" }).click();

  await page.waitForURL(/\/admin\/vendas\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { name: "5. Mandar o Pix" })).toBeVisible();
  await expect(page.getByText("Aguardando Pix")).toBeVisible();
  const message = await page.locator("pre").first().innerText();
  const payPath = message.match(/\/pagar\/[A-Za-z0-9_-]+/)?.[0];
  expect(payPath).toBeTruthy();

  // The customer opens the payment page.
  const visitor = await browser.newContext();
  const pay = await visitor.newPage();
  await pay.goto(payPath!);
  await expect(pay.getByRole("heading", { level: 1, name })).toBeVisible();
  await expect(pay.getByText("R$ 49,00")).toBeVisible();
  await expect(pay.getByRole("img", { name: "QR code do Pix" })).toBeVisible();

  // The Asaas webhook confirms the payment (simulated in demo mode).
  const confirm = await page.context().newPage();
  await confirm.goto("/demo#assinaturas");
  await confirm
    .locator("form", { hasText: name })
    .filter({ has: confirm.getByRole("button", { name: "Confirmar pagamento" }) })
    .first()
    .getByRole("button", { name: "Confirmar pagamento" })
    .click();
  await expect(confirm.getByText(/Pagamento confirmado: a assinatura foi ativada/)).toBeVisible();

  await expect(pay.getByText("Pagamento confirmado!")).toBeVisible({ timeout: 20_000 });
  await expect
    .poll(() => subjectsTo(email).some((s) => s.startsWith("Sua conta está pronta")))
    .toBe(true);

  await page.reload();
  await expect(page.getByText("Paga", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "6. Depois do pagamento" })).toBeVisible();

  // The site is live, in the template chosen in the sale.
  const siteUrl = (await page.locator("pre").first().innerText()).match(
    /https?:\/\/\S+\/site/,
  )?.[0];
  expect(siteUrl).toBeTruthy();
  await pay.goto(new URL(siteUrl!).pathname);
  await expect(pay.getByRole("heading", { level: 1, name })).toBeVisible();
  await expect(pay.getByText("Perguntas frequentes")).toBeVisible();
  await visitor.close();
});

test("sale with an own domain: first Pix with the first year, then register, connect and go live", async ({
  page,
}) => {
  const stamp = Date.now().toString(36);
  const name = `Dominio ${stamp}`;
  const domain = `studio-${stamp}.com.br`;

  await page.goto("/demo");
  await page
    .locator("form", { hasText: "admin@demo.com" })
    .getByRole("button", { name: "Entrar" })
    .click();
  await page.waitForURL(/\/admin/);
  await page.goto("/admin/vendas");
  await page.getByLabel("Nome do negócio").fill(name);
  await page.getByLabel(/Nome completo/).fill("Joana Dominio Teste");
  await page.getByLabel("CPF ou CNPJ").fill("529.982.247-25");
  await page.getByLabel(/E-mail/).fill(`dominio-${stamp}@exemplo.com`);
  await page.getByLabel(/Domínio próprio/).check();
  await page.getByLabel("Domínio", { exact: true }).fill(`www.${domain}`);
  await page.getByRole("button", { name: "Ver se está livre" }).click();
  await expect(page.getByText("Disponível ✓")).toBeVisible();
  await page.getByRole("button", { name: "Criar conta e gerar Pix" }).click();

  await page.waitForURL(/\/admin\/vendas\/[0-9a-f-]{36}$/);
  // R$ 49 + R$ 91 in the first Pix.
  await expect(page.locator("pre").first()).toContainText("R$ 140,00");
  await expect(page.locator("pre").first()).toContainText(`do domínio ${domain}`);

  const confirm = await page.context().newPage();
  await confirm.goto("/demo#assinaturas");
  await confirm
    .locator("form", { hasText: name })
    .filter({ has: confirm.getByRole("button", { name: "Confirmar pagamento" }) })
    .first()
    .getByRole("button", { name: "Confirmar pagamento" })
    .click();
  await expect(confirm.getByText(/Pagamento confirmado: a assinatura foi ativada/)).toBeVisible();

  await page.goto("/admin/vendas/dominios");
  const card = page.locator("section", { hasText: domain }).first();
  await expect(card.getByText("Registrar no Registro.br")).toBeVisible();
  await card.getByRole("button", { name: "Já registrei: conectar" }).click();
  // The screen refreshes with the new status.
  await expect(page.getByRole("heading", { name: `${domain} · Aguardando o DNS` })).toBeVisible();
  await page.getByRole("button", { name: "Verificar agora" }).first().click();
  await expect(page.locator("li", { hasText: domain }).getByText("No ar")).toBeVisible();
});

test("sales chat (/conheca): models with her name, plan, Pix, paid opens the panel", async ({
  page,
  browser,
}) => {
  const stamp = Date.now().toString(36);
  // No niche word in the name: the chat asks the area.
  const name = `Negócio ${stamp}`;
  const email = `chat-${stamp}@exemplo.com`;

  const visitor = await browser.newContext();
  const chat = await visitor.newPage();
  await chat.goto("/conheca");
  await expect(chat.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await chat.getByPlaceholder("Nome do seu negócio").fill(name);
  await chat.keyboard.press("Enter");
  await chat.getByRole("button", { name: "Manicure", exact: true }).click();

  // The example site opens over the chat, with her business name, and comes back.
  await chat.getByRole("button", { name: /Modelo 2 · Elegante/ }).click();
  const frame = chat.frameLocator('iframe[title="Prévia do site"]');
  await expect(frame.getByRole("heading", { level: 1, name })).toBeVisible();
  await chat.getByRole("button", { name: "Voltar para a conversa" }).click();
  await chat.getByRole("button", { name: "Modelo 2", exact: true }).click();
  await chat.getByRole("button", { name: "Quero o meu" }).click();
  await chat.getByRole("button", { name: /Site \+ Agenda/ }).click();
  await chat.getByRole("button", { name: /Mensal/ }).click();
  await chat.getByPlaceholder("Nome completo").fill("Maria Chat Teste");
  await chat.keyboard.press("Enter");
  await chat.getByPlaceholder("seuemail@exemplo.com").fill(email);
  await chat.keyboard.press("Enter");
  await chat.getByPlaceholder("(11) 99999-9999").fill("11988887777");
  await chat.keyboard.press("Enter");
  await chat.getByPlaceholder("CPF ou CNPJ").fill("529.982.247-25");
  await chat.keyboard.press("Enter");
  await expect(chat.getByText(/Site \+ Agenda · R\$ 49,00\/mês/)).toBeVisible();
  await chat.getByRole("button", { name: "Gerar meu Pix" }).click();
  await expect(chat.getByRole("img", { name: "QR code do Pix" })).toBeVisible({ timeout: 20_000 });
  await expect(chat.getByText("Aguardando o pagamento…")).toBeVisible();

  // The Asaas webhook confirms the payment (simulated in demo mode).
  await page.goto("/demo#assinaturas");
  await page
    .locator("form", { hasText: name })
    .filter({ has: page.getByRole("button", { name: "Confirmar pagamento" }) })
    .first()
    .getByRole("button", { name: "Confirmar pagamento" })
    .click();
  await expect(page.getByText(/Pagamento confirmado: a assinatura foi ativada/)).toBeVisible();

  await expect(chat.getByText(/Pagamento confirmado! 🎉 O seu site já está no ar/)).toBeVisible({
    timeout: 20_000,
  });
  await expect
    .poll(() => subjectsTo(email).some((s) => s.startsWith("Sua conta está pronta")))
    .toBe(true);
  // "Entrar no painel" logs her in on this device, once.
  await chat.getByRole("button", { name: "Entrar no painel" }).click();
  await chat.waitForURL(/\/painel/);
  await expect(chat.getByText(name).first()).toBeVisible();
  await visitor.close();
});
