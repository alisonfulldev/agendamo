import { readFileSync } from "node:fs";
import path from "node:path";

import { expect, test, type Page } from "@playwright/test";

/** Pro: deposit by Pix with a mandatory receipt, checked by the professional (demo mode). */

interface CapturedEmail {
  to: string[];
  subject: string;
}

function emails(address: string): CapturedEmail[] {
  try {
    const all = JSON.parse(
      readFileSync(path.join(process.cwd(), ".demo-data", "emails.json"), "utf8"),
    ) as CapturedEmail[];
    return all.filter((e) => e.to.includes(address));
  } catch {
    return [];
  }
}

const unique = () => Date.now().toString(36);

async function prepareStudio(page: Page) {
  await page.goto("/demo#planos");
  const row = page.locator("#planos form", { hasText: "Studio Bela" });
  await row.getByRole("button", { name: "Assinante", exact: true }).click();
  await page.waitForURL(/ok=plano/);
  await page
    .locator("#planos form", { hasText: "Studio Bela" })
    .getByRole("button", { name: "Ligar sinal Pix" })
    .click();
  await page.waitForURL(/ok=sinal/);
}

/** Books through the chat up to the Pix (the policy is accepted before booking). */
async function bookWithDeposit(page: Page, name: string, email: string) {
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
    .last()
    .click();
  await page.getByLabel("Seu nome").fill(name);
  await page.getByRole("button", { name: "Enviar" }).click();
  await page.getByLabel("WhatsApp").fill(`1198${Date.now().toString().slice(-7)}`);
  await page.getByRole("button", { name: "Enviar" }).click();
  await page.getByLabel("E-mail").fill(email);
  await page.getByRole("button", { name: "Enviar" }).click();
  const noCoupon = page.getByRole("button", { name: "Não tenho" });
  if (await noCoupon.isVisible().catch(() => false)) await noCoupon.click();
  await expect(page.getByText(/Política de cancelamento e devolução/)).toBeVisible();
  await page.getByRole("button", { name: "Aceito a política e quero reservar" }).click();
  await expect(page.getByTestId("deposit-payment")).toBeVisible();
}

/** A small valid PDF, different on every run (same file twice in one run = duplicate). */
function receiptPdf(): Buffer {
  return Buffer.from(
    `%PDF-1.4\n% comprovante ${unique()}\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF\n`,
  );
}

test("phone: pay by Pix, send the receipt (no way to only say “já paguei”), the owner confirms", async ({
  browser,
}) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await prepareStudio(page);
  const pdf = receiptPdf();

  const email = `sinal-${unique()}@exemplo.com`;
  const customer = `Cliente Sinal ${unique()}`;
  await bookWithDeposit(page, customer, email);
  const payment = page.getByTestId("deposit-payment");
  // Unique cents taken off a R$ 30 deposit: the customer never pays more.
  await expect(
    payment.getByText(/Para garantir seu horário, faça o Pix de R\$ 29,\d{2}/),
  ).toBeVisible();
  await expect(payment.getByRole("img", { name: "QR code do Pix" })).toBeVisible();
  await expect(payment.getByText(/Horário reservado por/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Já paguei", exact: true })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Já paguei", exact: true })).toHaveCount(0);

  await page.getByLabel("Comprovante do Pix").setInputFiles({
    name: "comprovante.pdf",
    mimeType: "application/pdf",
    buffer: pdf,
  });
  await expect(
    page.getByText(/Recebemos seu comprovante! Seu horário está pré-confirmado/),
  ).toBeVisible();

  // The same file in another booking is refused.
  const second = await context.newPage();
  await bookWithDeposit(second, "Cliente Duplicado", `dup-${unique()}@exemplo.com`);
  await second.getByLabel("Comprovante do Pix").setInputFiles({
    name: "comprovante.pdf",
    mimeType: "application/pdf",
    buffer: pdf,
  });
  await expect(
    second.getByText("Esse comprovante já foi usado em outro agendamento."),
  ).toBeVisible();

  // An empty or fake file is refused too.
  await second.getByLabel("Comprovante do Pix").setInputFiles({
    name: "comprovante.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("isto não é um pdf"),
  });
  await expect(second.getByText(/não parece um comprovante válido/)).toBeVisible();

  // The owner checks it in the bank and confirms (never automatic); the customer is told.
  const owner = await context.newPage();
  await owner.goto("/demo");
  await owner
    .locator("form", { hasText: "dona.beleza@demo.com" })
    .getByRole("button", { name: "Entrar" })
    .click();
  await owner.waitForURL(/\/painel/);
  await expect(owner.getByText(/comprovantes? de Pix para conferir/)).toBeVisible();
  await owner.goto("/painel/sinais");
  const item = owner.locator("li", { hasText: customer });
  await expect(item.getByText(/R\$ 29,\d{2}/).first()).toBeVisible();
  await expect(item.getByRole("img", { name: "Comprovante enviado pelo cliente" })).toHaveCount(0);
  await expect(item.getByRole("link", { name: /Abrir comprovante/ })).toBeVisible();
  const before = emails(email).length;
  await item.getByRole("button", { name: "Confirmar recebimento" }).click();
  await expect(owner.locator("li", { hasText: customer }).getByText(/Confirmado/)).toBeVisible();
  await expect.poll(() => emails(email).length).toBeGreaterThan(before);
  expect(emails(email)[0]!.subject).toMatch(/Horário confirmado/);
  await context.close();
});

test("a reservation without receipt expires and frees the time", async ({ page }) => {
  await prepareStudio(page);
  const name = `Cliente Expira ${unique()}`;
  await bookWithDeposit(page, name, `expira-${unique()}@exemplo.com`);
  await page.goto("/demo#tarefas");
  await page.getByRole("button", { name: "Vencer reservas de sinal" }).click();
  await page.waitForURL(/ok=vencer/);
  await page.getByRole("button", { name: "Sinais Pix vencidos" }).click();
  await page.waitForURL(/cron=deposits/);

  await page.goto("/demo");
  await page
    .locator("form", { hasText: "dona.beleza@demo.com" })
    .getByRole("button", { name: "Entrar" })
    .click();
  await page.waitForURL(/\/painel/);
  await page.goto("/painel/sinais");
  await expect(page.locator("li", { hasText: name }).getByText(/Expirado/)).toBeVisible();
});
