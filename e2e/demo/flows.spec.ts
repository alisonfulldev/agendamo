import { readFileSync } from "node:fs";
import path from "node:path";

import { expect, test } from "@playwright/test";

/** Key flows in demo mode, checking the e-mails captured in .demo-data/emails.json. */
interface CapturedEmail {
  to: string[];
  subject: string;
  html: string;
}

function emailsTo(address: string): CapturedEmail[] {
  try {
    const all = JSON.parse(
      readFileSync(path.join(process.cwd(), ".demo-data", "emails.json"), "utf8"),
    ) as CapturedEmail[];
    return all.filter((email) => email.to.includes(address));
  } catch {
    return [];
  }
}

const unique = () => Date.now().toString(36);

test("sign up, confirm by the e-mail link and reach the business wizard", async ({ page }) => {
  const email = `teste-${unique()}@exemplo.com`;
  await page.goto("/cadastro?brand=barber");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill("senha-forte-123");
  await page.locator("#terms").click();
  await page.getByRole("button", { name: "Criar conta grátis" }).click();
  await expect(page.getByText(/Enviamos um link de confirmação/)).toBeVisible();

  await expect.poll(() => emailsTo(email).length).toBe(1);
  const link = /href="([^"]*\/auth\/confirm[^"]*)"/.exec(emailsTo(email)[0]!.html)?.[1];
  expect(link).toBeTruthy();
  await page.goto(link!.replace(/&amp;/g, "&"));
  await expect(page).toHaveURL(/\/painel\/novo/);

  // The wizard starts at the business name: the segment comes from the brand.
  const slug = `barbearia-${unique()}`;
  await expect(page.getByText("Passo 1 de 4")).toBeVisible();
  await page.getByLabel("Nome do negócio").fill("Barbearia Teste");
  await page.getByLabel("Seu link").fill(slug);
  await expect(page.getByText("Disponível!")).toBeVisible();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByLabel("WhatsApp").fill("11999998888");
  await page.getByLabel("Cidade").fill("São Paulo");
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.locator("button", { hasText: /^\+ / }).first().click();
  await page.getByLabel("Preço (R$)").first().fill("45");
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("button", { name: /Criar meu chat de agendamento/ }).click();
  await expect(
    page.getByRole("heading", { name: "Seu chat de agendamento está no ar!" }),
  ).toBeVisible();
  // Right after the wizard, the panel opens with its header and menu.
  await page.getByRole("button", { name: "Ir para o painel" }).click();
  await expect(page.getByRole("navigation", { name: "Painel" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Agenda" })).toBeVisible();
  await page.goto(`/${slug}?brand=barber`);
  await expect(page.getByRole("heading", { name: /Agendar com Barbearia Teste/ })).toBeAttached();
});

test("book through the chat: customer and owner get e-mails", async ({ page }) => {
  const email = `cliente-${unique()}@exemplo.com`;
  await page.goto("/studio-bela?brand=beauty");
  await page
    .getByRole("button", { name: /Manicure/ })
    .first()
    .click();
  await page
    .getByRole("button", { name: /, \d{1,2} de [a-zç]+$/i })
    .first()
    .click();
  await page
    .locator("button")
    .filter({ hasText: /^\d{2}:\d{2}$/ })
    .first()
    .click();
  await page.getByLabel("Seu nome").fill("Cliente Demo");
  await page.getByRole("button", { name: "Enviar" }).click();
  await page.getByLabel("WhatsApp").fill(`119${Date.now().toString().slice(-8)}`);
  await page.getByRole("button", { name: "Enviar" }).click();
  await page.getByLabel("E-mail").fill(email);
  await page.getByRole("button", { name: "Enviar" }).click();
  const noCoupon = page.getByRole("button", { name: "Não tenho" });
  if (await noCoupon.isVisible().catch(() => false)) await noCoupon.click();
  await page.getByRole("button", { name: "Confirmar agendamento" }).click();
  // The customer's answer to the summary stays in the conversation.
  await expect(page.getByText(/^Confirmar agendamento\s/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Confirmar agendamento" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Google Agenda" })).toHaveAttribute(
    "href",
    /calendar\.google\.com\/calendar\/render\?action=TEMPLATE/,
  );
  await expect(page.getByRole("link", { name: "Calendário do iPhone" })).toHaveAttribute(
    "href",
    /\/api\/ics\//,
  );

  await expect.poll(() => emailsTo(email).length).toBeGreaterThan(0);
  await expect
    .poll(
      () =>
        emailsTo("dona.beleza@demo.com").filter((e) => e.subject.includes("Cliente Demo")).length,
    )
    .toBeGreaterThan(0);
});

test("trial ended: the chat ends on the owner's WhatsApp and the panel only opens the plan", async ({
  page,
}) => {
  await page.goto("/barbearia-navalha?brand=barber");
  await page.getByRole("button", { name: "Corte", exact: true }).click();
  await page
    .getByRole("button", { name: /, \d{1,2} de [a-zç]+$/i })
    .first()
    .click();
  await page
    .locator("button")
    .filter({ hasText: /^\d{2}:\d{2}$/ })
    .first()
    .click();
  await page.getByLabel("Seu nome").fill("Cliente WhatsApp");
  await page.getByRole("button", { name: "Enviar" }).click();
  await page.getByRole("button", { name: "Sem recado" }).click();
  const send = page.getByRole("link", { name: "Enviar pelo WhatsApp" });
  await expect(send).toHaveAttribute("href", /wa\.me\/55\d+\?text=.*Corte/);

  await page.goto("/demo");
  await page
    .locator("form", { hasText: "dono.barbearia@demo.com" })
    .getByRole("button", { name: "Entrar" })
    .click();
  await page.waitForURL(/\/painel\/plano/);
  await expect(page.getByText("Seu teste grátis terminou")).toBeVisible();
  await page.goto("/painel/agenda");
  await expect(page).toHaveURL(/\/painel\/plano/);
});

test("finance: automatic revenues, a new cost and the month's profit", async ({ page }) => {
  await page.goto("/demo");
  await page
    .locator("form", { hasText: "dona.beleza@demo.com" })
    .getByRole("button", { name: "Entrar" })
    .click();
  await page.waitForURL(/\/painel/);
  await page.goto("/painel/financeiro");
  // The sample appointments and costs are in previous months.
  await page.getByRole("link", { name: "Mês anterior" }).click();
  await expect(page.getByText("automático").first()).toBeVisible();
  await expect(page.getByText("Aluguel").first()).toBeVisible();

  const description = `Cera ${unique()}`;
  await page.getByRole("button", { name: "Lançar custo" }).click();
  await page.getByLabel("Descrição").fill(description);
  await page.getByLabel("Categoria").selectOption("Produtos e materiais");
  await page.getByLabel("Valor (R$)").fill("12,50");
  await page.getByRole("button", { name: "Salvar" }).click();
  const row = page.locator("li", { hasText: description });
  await expect(row).toContainText("12,50");

  page.once("dialog", (dialog) => void dialog.accept());
  await row.getByRole("button", { name: `Excluir ${description}` }).click();
  await expect(page.locator("li", { hasText: description })).toHaveCount(0);
});

test("booking without e-mail: the e-mail is optional and not mentioned at the end", async ({
  page,
}) => {
  await page.goto("/movimento-fisio?brand=physio");
  await page
    .getByRole("button", { name: /Pilates clínico/ })
    .first()
    .click();
  await page
    .getByRole("button", { name: /, \d{1,2} de [a-zç]+$/i })
    .first()
    .click();
  await page
    .locator("button")
    .filter({ hasText: /^\d{2}:\d{2}$/ })
    .first()
    .click();
  await page.getByLabel("Seu nome").fill("Paciente Sem Email");
  await page.getByRole("button", { name: "Enviar" }).click();
  await page.getByLabel("WhatsApp").fill(`119${Date.now().toString().slice(-8)}`);
  await page.getByRole("button", { name: "Enviar" }).click();
  await page.getByRole("button", { name: "Prefiro não informar" }).click();
  const noCoupon = page.getByRole("button", { name: "Não tenho" });
  if (await noCoupon.isVisible().catch(() => false)) await noCoupon.click();
  await page.getByRole("button", { name: "Confirmar agendamento" }).click();
  const done = page.getByText(/Sua sessão está confirmada/);
  await expect(done).toBeVisible();
  await expect(done).not.toContainText("e-mail");
});

test("signed in on another brand: sign-up shows the account in use and lets you switch", async ({
  page,
}) => {
  await page.goto("/demo");
  await page
    .locator("form", { hasText: "dona.beleza@demo.com" })
    .getByRole("button", { name: "Entrar" })
    .click();
  await page.waitForURL(/\/painel/);
  await page.goto("/?brand=psychology");
  await page.getByRole("link", { name: "Testar 30 dias grátis" }).first().click();
  await expect(page).toHaveURL(/\/cadastro/);
  await expect(page.getByText("dona.beleza@demo.com")).toBeVisible();
  await page.getByRole("button", { name: "Sair e usar outra conta" }).click();
  await expect(page).toHaveURL(/\/cadastro/);
  await expect(page.getByRole("button", { name: "Criar conta grátis" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-brand", "psychology");
});
