import { readFileSync } from "node:fs";
import path from "node:path";

import { expect, test } from "@playwright/test";

/**
 * Meta ad page (/ativar, 2026-11-17): animated tutorial (a customer booking, then the panel),
 * real account without the 14-day trial and the Pix right away.
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

test("ad page: tutorial, account and the Pix right away", async ({ page }) => {
  const name = `Barbearia Ativa ${unique()}`;
  const email = `ativa-${unique()}@gmail.com`;
  const slug = name.toLowerCase().replace(/\s+/g, "-");
  const shots = path.join("test-results", "ativar");

  // Older ad links with ?ramo= move to ?area=, so the tutorial shows before the conversation.
  await page.setViewportSize({ width: 412, height: 915 });
  await page.goto("/ativar?ramo=barbearia&utm_source=meta");
  await expect(page).toHaveURL(/\/ativar\?area=barbearia&utm_source=meta$/);
  const tutorial = page.getByRole("region", { name: "Tutorial: como funciona" });
  await expect(tutorial.getByText("Passo 1 de 8")).toBeVisible();
  await expect(tutorial.getByText("O cliente abre o seu link")).toBeVisible();
  // It moves on by itself: paused here to go step by hand, with a screenshot of each.
  await tutorial.getByRole("button", { name: "Pausar" }).click();
  for (let i = 1; i <= 8; i++) {
    await expect(tutorial.getByText(`Passo ${i} de 8`)).toBeVisible();
    await page.waitForTimeout(3800);
    await tutorial.screenshot({ path: path.join(shots, `passo-${i}.png`) });
    if (i < 8) await tutorial.getByRole("button", { name: "Próximo" }).click();
  }
  await expect(tutorial.getByText("Clientes e faturamento num lugar só")).toBeVisible();

  // "Quero o meu": the conversation opens with the niche already chosen.
  await page.getByRole("link", { name: "Quero o meu" }).click();
  const dialog = page.locator("[data-creation]");
  await dialog.getByLabel("Nome do negócio").fill(name);
  await page.waitForTimeout(1600);
  await dialog.getByRole("button", { name: "Enviar", exact: true }).click();
  await expect(dialog.getByText(/Agora é só criar sua conta e ativar/)).toBeVisible();
  await dialog.getByLabel("(11) 99999-8888").fill(`119${Date.now().toString().slice(-8)}`);
  await dialog.getByRole("button", { name: "Enviar", exact: true }).click();
  await dialog.getByLabel("seu@email.com").fill(email);
  await dialog.getByRole("button", { name: "Enviar", exact: true }).click();
  const before = codes(email).length;
  await dialog.getByRole("button", { name: "Aceito, enviar o código" }).click();
  await expect.poll(() => codes(email).length).toBeGreaterThan(before);
  await dialog.getByLabel("Código de 4 números").fill(codes(email)[0]!);
  await dialog.getByRole("button", { name: "Enviar", exact: true }).click();

  // The session starts and the page goes straight to her link and the payment.
  await expect(page.getByRole("heading", { name: "Sua conta está criada! 🎉" })).toBeVisible();
  await expect(page.getByText(new RegExp(`/${slug}$`))).toBeVisible();
  await page.screenshot({ path: path.join(shots, "pagamento.png"), fullPage: true });

  // No trial: until she pays, the link hands off to the WhatsApp (waiting mode card).
  const client = await page.context().newPage();
  await client.goto(`/${slug}?brand=barber`);
  await expect(
    client.getByRole("link", { name: /Agende também com o MeetChat/ }).first(),
  ).toBeVisible();
  // And her panel sends her back here to pay.
  await client.goto("/painel/agenda");
  await expect(client).toHaveURL(/\/ativar/);
  await client.close();

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
