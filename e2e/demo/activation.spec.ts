import { readFileSync } from "node:fs";
import path from "node:path";

import { expect, test } from "@playwright/test";

/**
 * Meta ad page (/ativar, 2026-11-17): real account without the 14-day trial, the owner books
 * herself on her link (the demonstration ends right there), sees what happened and pays by Pix.
 */

interface CapturedEmail {
  to: string[];
  subject: string;
}

function codes(address: string): string[] {
  try {
    const all = JSON.parse(
      readFileSync(path.join(process.cwd(), ".demo-data", "emails.json"), "utf8"),
    ) as CapturedEmail[];
    return all
      .filter((e) => e.to.includes(address) && e.subject.includes("Seu código"))
      .map((e) => /(\d{4})/.exec(e.subject)?.[1] ?? "");
  } catch {
    return [];
  }
}

const unique = () => Date.now().toString(36);

test("ad page: account, test booking on the real link, then the Pix", async ({ page }) => {
  const name = `Barbearia Ativa ${unique()}`;
  const email = `ativa-${unique()}@gmail.com`;
  const slug = name.toLowerCase().replace(/\s+/g, "-");

  // The ad link: the niche is already chosen, the conversation opens by itself.
  await page.goto("/ativar?ramo=barbearia");
  const dialog = page.locator("[data-creation]");
  await dialog.getByLabel("Nome do negócio").fill(name);
  await page.waitForTimeout(1600);
  await dialog.getByRole("button", { name: "Enviar", exact: true }).click();

  // No simulation and no trial: straight to the account.
  await expect(dialog.getByText(/testar no seu link de verdade/)).toBeVisible();
  await dialog.getByLabel("(11) 99999-8888").fill(`119${Date.now().toString().slice(-8)}`);
  await dialog.getByRole("button", { name: "Enviar", exact: true }).click();
  await dialog.getByLabel("seu@email.com").fill(email);
  await dialog.getByRole("button", { name: "Enviar", exact: true }).click();
  const before = codes(email).length;
  await dialog.getByRole("button", { name: "Aceito, enviar o código" }).click();
  await expect.poll(() => codes(email).length).toBeGreaterThan(before);
  await dialog.getByLabel("Código de 4 números").fill(codes(email)[0]!);
  await dialog.getByRole("button", { name: "Enviar", exact: true }).click();
  // The session starts and the page re-renders straight into the test step, with her real link.
  await expect(page.getByRole("heading", { name: "Agora seja seu cliente" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Abrir meu link e agendar/ })).toHaveAttribute(
    "href",
    new RegExp(`/${slug}$`),
  );

  // She books herself on her link, in another tab.
  const client = await page.context().newPage();
  await client.goto(`/${slug}?brand=barber`);
  await client
    .getByRole("button", { name: /^Corte/ })
    .first()
    .click();
  await client
    .getByRole("button", { name: /, \d{1,2} de [a-zç]+$/i })
    .first()
    .click();
  await client
    .locator("button")
    .filter({ hasText: /^\d{2}:\d{2}$/ })
    .first()
    .click();
  await client.getByLabel("Seu nome").fill("Dona Testando");
  await client.getByRole("button", { name: "Enviar" }).click();
  await client.getByLabel("WhatsApp").fill(`119${Date.now().toString().slice(-8)}`);
  await client.getByRole("button", { name: "Enviar" }).click();
  await client.getByLabel("E-mail").fill(email);
  await client.getByRole("button", { name: "Enviar" }).click();
  const noCoupon = client.getByRole("button", { name: "Não tenho" });
  if (await noCoupon.isVisible().catch(() => false)) await noCoupon.click();
  await client.getByRole("button", { name: "Confirmar agendamento" }).click();
  await expect(client.getByRole("link", { name: "Google Agenda" })).toBeVisible();

  // The ad page notices the booking by itself and asks for the payment.
  await expect(page.getByRole("heading", { name: "Funcionou! 🎉" })).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByText(/Dona Testando/)).toBeVisible();

  // The demonstration is over: the link hands off to the WhatsApp until she pays.
  await client.goto(`/${slug}?brand=barber`);
  // (waiting mode: the full "Agende também com o MeetChat" card in the footer).
  await expect(
    client.getByRole("link", { name: /Agende também com o MeetChat/ }).first(),
  ).toBeVisible();

  await page.getByLabel(/Nome ou razão social/).fill("Barbearia Ativa LTDA");
  await page.getByLabel("CPF ou CNPJ").fill("529.982.247-25");
  await page.getByRole("button", { name: /^Ativar com Pix/ }).click();
  await expect(page.getByRole("img", { name: "QR code do Pix" })).toBeVisible();

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

  await expect(page.getByRole("heading", { name: "Sua agenda está no ar! 🎉" })).toBeVisible({
    timeout: 20_000,
  });
  await page.getByRole("link", { name: "Entrar no meu painel" }).click();
  await expect(page).toHaveURL(/\/painel/);
});
