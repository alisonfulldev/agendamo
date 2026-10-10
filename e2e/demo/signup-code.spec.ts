import { readFileSync } from "node:fs";
import path from "node:path";

import { expect, test, type Page } from "@playwright/test";

// Tiny PNG (8x8) for the optional photo of the conversation.
const PHOTO = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAEklEQVR4nGP4z8CAFWEXHbQSACj/P8Fu7N9hAAAAAElFTkSuQmCC",
  "base64",
);

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
  const dialog = page.locator("[data-creation]");
  await dialog.getByLabel("Nome do negócio").fill(name);
  await page.waitForTimeout(1600);
  await dialog.getByRole("button", { name: "Enviar", exact: true }).click();
  await dialog.getByRole("button", { name: "Isso mesmo" }).click();
  await dialog.getByRole("button", { name: "Criar minha conta grátis" }).click();
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
  // A new phone each run (one trial per person: a reused phone gets no new trial).
  await dialog.getByLabel("(11) 99999-8888").fill(`119${Date.now().toString().slice(-8)}`);
  await dialog.getByRole("button", { name: "Enviar", exact: true }).click();

  // Typo in the domain: suggestion accepted.
  await dialog.getByLabel("seu@email.com").fill(`${user}@gmial.com`);
  await dialog.getByRole("button", { name: "Enviar", exact: true }).click();
  await expect(dialog.getByText(`Você quis dizer ${email}?`)).toBeVisible();
  await dialog.getByRole("button", { name: "Sim", exact: true }).click();

  // End of the conversation: Grátis or a 7-day trial, no card.
  await expect(dialog.getByText("Como você quer começar? Tudo sem cartão.")).toBeVisible();
  await dialog.getByRole("button", { name: "Testar o Pro por 7 dias" }).click();
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
  // The end leads only to the panel: the link is shown there, not here.
  await expect(dialog.getByText(`🎉 Sua conta está pronta, ${name}!`)).toBeVisible();
  await expect(
    dialog.getByText("Seu link de agendamento está te esperando no painel."),
  ).toBeVisible();
  await expect(dialog.getByRole("img", { name: "QR code do seu link" })).toHaveCount(0);
  const slug = name.toLowerCase().replace(/\s+/g, "-");

  // Signed in, with the business ready; the first-access tutorial can be skipped.
  await dialog.getByRole("button", { name: "Entrar no meu painel" }).click();
  await expect(page).toHaveURL(/\/painel/);
  await expect(page.getByRole("navigation", { name: "Painel" })).toBeVisible();
  await page.getByRole("button", { name: "Pular tutorial" }).click();
  await expect(page.getByTestId("tour")).toHaveCount(0);
  // The Pro trial chosen at sign-up: counter in the panel, everything unlocked.
  await expect(page.getByRole("link", { name: /Teste do Pro: faltam 7 dias/ })).toBeVisible();
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
  await dialog.getByRole("button", { name: /^Começar grátis/ }).click();
  await dialog.getByRole("button", { name: "Aceito, enviar o código" }).click();
  await expect(dialog.getByText(/Esse e-mail já tem conta/)).toBeVisible();
  await dialog
    .getByLabel("Código de 4 números")
    .fill(await newCode("dona.beleza@demo.com", before));
  await dialog.getByRole("button", { name: "Enviar", exact: true }).click();
  await expect(dialog.getByText(/Você já tem um negócio no MeetChat/)).toBeVisible();
  await dialog.getByRole("button", { name: "Entrar no meu painel" }).click();
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

test("the optional photo of the conversation becomes the profile photo", async ({ page }) => {
  const name = `Barbearia Foto ${unique()}`;
  const email = `foto-${unique()}@exemplo.com`;
  await page.goto("/?criar=1");
  const dialog = page.locator("[data-creation]");
  await dialog.getByLabel("Nome do negócio").fill(name);
  await page.waitForTimeout(1600);
  await dialog.getByRole("button", { name: "Enviar", exact: true }).click();
  await dialog.getByRole("button", { name: "Isso mesmo" }).click();

  // Optional: shown in the header of her chat, never blocking the test booking.
  const add = dialog.getByRole("button", { name: /Adicionar sua foto/ });
  await expect(add).toBeVisible();
  await dialog.getByRole("button", { name: "Ver como meu cliente vai agendar" }).click();
  await expect(dialog.locator("button").filter({ hasText: /·/ }).first()).toBeVisible();
  await dialog.locator('input[type="file"]').setInputFiles({
    name: "eu.png",
    mimeType: "image/png",
    buffer: PHOTO,
  });
  await expect(dialog.getByRole("button", { name: "Trocar foto" })).toBeVisible();
  await expect(dialog.locator("header").locator("img")).toHaveAttribute("src", /demos\//);

  await dialog.getByRole("button", { name: "Criar minha conta grátis" }).click();
  await dialog.getByRole("button", { name: "Depois" }).click();
  await dialog.getByLabel("seu@email.com").fill(email);
  await dialog.getByRole("button", { name: "Enviar", exact: true }).click();
  const before = codes(email).length;
  await dialog.getByRole("button", { name: /^Começar grátis/ }).click();
  await dialog.getByRole("button", { name: "Aceito, enviar o código" }).click();
  await dialog.getByLabel("Código de 4 números").fill(await newCode(email, before));
  await dialog.getByRole("button", { name: "Enviar", exact: true }).click();
  await expect(dialog.getByText(`🎉 Sua conta está pronta, ${name}!`)).toBeVisible();

  await page.goto("/painel/pagina");
  await expect(page.locator('img[src*="/avatar/"]').first()).toBeVisible();
});

test("first access on the phone: bottom tabs and the tutorial, tapping like a game", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const email = `tour-${unique()}@gmail.com`;
  const dialog = await startConversation(page, `Barbearia Tour ${unique()}`);
  await dialog.getByRole("button", { name: "Depois" }).click();
  await dialog.getByLabel("seu@email.com").fill(email);
  await dialog.getByRole("button", { name: "Enviar", exact: true }).click();
  const before = codes(email).length;
  await dialog.getByRole("button", { name: /^Começar grátis/ }).click();
  await dialog.getByRole("button", { name: "Aceito, enviar o código" }).click();
  await dialog.getByLabel("Código de 4 números").fill(await newCode(email, before));
  await dialog.getByRole("button", { name: "Enviar", exact: true }).click();
  await dialog.getByRole("button", { name: "Entrar no meu painel" }).click();

  const tour = page.getByTestId("tour");
  // The bottom tabs (rendered after the side menu, which the phone hides).
  const tabs = page.getByRole("navigation", { name: "Painel" }).last();
  await expect(tabs.getByRole("link", { name: "Agenda" })).toBeVisible();
  await expect(tour.getByText("Este é o seu painel!")).toBeVisible();
  await tour.getByRole("button", { name: "Começar" }).click();

  await expect(tour.getByText("Agora toque em Agenda.")).toBeVisible();
  await tabs.getByRole("link", { name: "Agenda" }).click();
  await expect(page).toHaveURL(/\/painel\/agenda/);
  await expect(tour.getByText("Aqui caem os agendamentos")).toBeVisible();
  await tour.getByRole("button", { name: "Próximo" }).click();

  await expect(tour.getByText("Toque em Mais")).toBeVisible();
  await tabs.getByRole("button", { name: "Mais" }).click();
  await expect(tour.getByText("Toque em Configurações.")).toBeVisible();
  await page
    .getByRole("navigation", { name: "Mais opções do painel" })
    .getByRole("link", { name: /Configurações/ })
    .click();
  await expect(page).toHaveURL(/\/painel\/configuracoes/);
  await expect(tour.getByText("Dias e horários de atendimento")).toBeVisible();
  await tour.getByRole("button", { name: "Próximo" }).click();

  // The link and the chat come last, back on Início.
  await expect(tour.getByText("Toque em Início.")).toBeVisible();
  await tabs.getByRole("link", { name: "Início" }).click();
  await expect(page).toHaveURL(/\/painel$/);
  await expect(tour.getByText("Seu link de agendamento")).toBeVisible();
  await page.getByRole("button", { name: "Copiar link" }).first().click();

  await expect(tour.getByText("Veja como seus clientes veem")).toBeVisible();
  const popup = page.waitForEvent("popup");
  await page.getByRole("link", { name: "Ver chat" }).click();
  await (await popup).close();

  await expect(tour.getByText(/divulgar seu link/)).toBeVisible();
  await tour.getByRole("button", { name: "Concluir" }).click();
  await expect(tour).toHaveCount(0);

  // Done for good: it does not start by itself again, but "Ver tutorial" replays it.
  await page.goto("/painel");
  await page.waitForTimeout(1500);
  await expect(tour).toHaveCount(0);
  await page.getByRole("link", { name: "Ver tutorial" }).click();
  await expect(tour.getByText("Este é o seu painel!")).toBeVisible();
});
