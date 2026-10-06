import { readFileSync } from "node:fs";
import path from "node:path";

import { expect, test, type Page } from "@playwright/test";

/** Sign-up and sign-in by e-mail code (codes read from .demo-data/emails.json). */

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

/** Waits for a code newer than the ones the address already had (mailbox keeps old runs). */
async function newCode(address: string, before: number): Promise<string> {
  await expect.poll(() => codes(address).length).toBeGreaterThan(before);
  // The demo mailbox keeps the newest e-mail first.
  return codes(address)[0]!;
}

const unique = () => Date.now().toString(36);

async function startConversation(page: Page, name: string) {
  await page.goto("/?criar=1");
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Nome do negócio").fill(name);
  await page.waitForTimeout(1600);
  await dialog.getByRole("button", { name: "Enviar", exact: true }).click();
  await dialog.getByRole("button", { name: "Isso mesmo" }).click();
  await dialog.getByRole("button", { name: "Quero esse link para mim" }).click();
  return dialog;
}

test("sign-up in the conversation: WhatsApp, e-mail fix, terms, code and the link live", async ({
  page,
}) => {
  const name = `Barbearia Codigo ${unique()}`;
  const user = `dono-${unique()}`;
  const email = `${user}@gmail.com`;
  const dialog = await startConversation(page, name);

  await expect(dialog.getByText(/Qual o seu WhatsApp\?/)).toBeVisible();
  await dialog.getByLabel("(11) 99999-8888").fill("11988887777");
  await dialog.getByRole("button", { name: "Enviar", exact: true }).click();

  // Typo in the domain: suggestion accepted.
  await dialog.getByLabel("seu@email.com").fill(`${user}@gmial.com`);
  await dialog.getByRole("button", { name: "Enviar", exact: true }).click();
  await expect(dialog.getByText(`Você quis dizer ${email}?`)).toBeVisible();
  await dialog.getByRole("button", { name: "Sim", exact: true }).click();

  await expect(dialog.getByRole("link", { name: "Termos de uso" })).toBeVisible();
  const before = codes(email).length;
  await dialog.getByRole("button", { name: "Aceito, enviar o código" }).click();
  await expect(dialog.getByText(`Te mandei um código de 4 números para ${email}.`)).toBeVisible();
  await expect(dialog.getByRole("button", { name: /Reenviar em \d+s/ })).toBeDisabled();
  const code = await newCode(email, before);

  // A wrong code first.
  const wrong = code === "0000" ? "1111" : "0000";
  await dialog.getByLabel("Código de 4 números").fill(wrong);
  await dialog.getByRole("button", { name: "Enviar", exact: true }).click();
  await expect(dialog.getByText(/Esse código não confere/)).toBeVisible();

  await dialog.getByLabel("Código de 4 números").fill(code);
  await dialog.getByRole("button", { name: "Enviar", exact: true }).click();
  await expect(dialog.getByText(`Pronto, ${name}! Seu link está no ar:`)).toBeVisible();
  await expect(dialog.getByRole("img", { name: "QR code do seu link" })).toBeVisible();
  const slug = name.toLowerCase().replace(/\s+/g, "-");
  await expect(dialog.getByRole("link", { name: new RegExp(slug) })).toBeVisible();

  // Signed in, with the business ready.
  await dialog.getByRole("button", { name: "Ir para meu painel" }).first().click();
  await expect(page).toHaveURL(/\/painel/);
  await expect(page.getByRole("navigation", { name: "Painel" })).toBeVisible();
  await page.goto(`/${slug}`);
  await expect(page.getByText(/Você está na agenda de/)).toBeVisible();

  // No password yet: "Criar senha" in Conta.
  await page.goto("/painel/conta");
  await page.getByLabel("Nova senha").fill("senha-forte-123");
  await page.getByLabel("Repita a senha").fill("senha-forte-123");
  await page.getByRole("button", { name: "Criar senha" }).click();
  await expect(page.getByText(/Senha criada/)).toBeVisible();
});

test("an e-mail that already has a business signs in instead", async ({ page }) => {
  const dialog = await startConversation(page, `Barbearia Existe ${unique()}`);
  await dialog.getByRole("button", { name: "Depois" }).click();
  await dialog.getByLabel("seu@email.com").fill("dona.beleza@demo.com");
  await dialog.getByRole("button", { name: "Enviar", exact: true }).click();
  const before = codes("dona.beleza@demo.com").length;
  await dialog.getByRole("button", { name: "Aceito, enviar o código" }).click();
  await expect(dialog.getByText(/Esse e-mail já tem conta/)).toBeVisible();
  await dialog
    .getByLabel("Código de 4 números")
    .fill(await newCode("dona.beleza@demo.com", before));
  await dialog.getByRole("button", { name: "Enviar", exact: true }).click();
  await expect(dialog.getByText(/Você já tem um negócio no Agendamo/)).toBeVisible();
  await dialog.getByRole("button", { name: "Ir para meu painel" }).click();
  await expect(page).toHaveURL(/\/painel/);
});

test("/entrar signs in with an e-mail code by default", async ({ page }) => {
  await page.goto("/entrar");
  const before = codes("fisio@demo.com").length;
  await page.locator("#code-email").fill("fisio@demo.com");
  await page.getByRole("button", { name: "Receber código por e-mail" }).click();
  await expect(page.getByText(/enviamos um código de 4 números/)).toBeVisible();
  await page.getByLabel("Código de 4 números").fill(await newCode("fisio@demo.com", before));
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/painel/);
  await expect(page.getByRole("navigation", { name: "Painel" })).toBeVisible();
});
