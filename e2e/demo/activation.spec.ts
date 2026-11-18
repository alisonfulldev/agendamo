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

test("ad page: tutorial, account, mandatory panel tutorial and the Pix at the end", async ({
  page,
}) => {
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
    if (i < 8) await tutorial.getByRole("button", { name: "Próximo" }).click();
  }
  await expect(tutorial.getByText("Clientes e faturamento num lugar só")).toBeVisible();

  // "Quero o meu": the conversation opens with the niche already chosen.
  await page.getByRole("link", { name: "Quero o meu" }).click();
  const dialog = page.locator("[data-creation]");
  await dialog.getByLabel("Nome do negócio").fill(name);
  await page.waitForTimeout(1600);
  await dialog.getByRole("button", { name: "Enviar", exact: true }).click();
  await expect(dialog.getByText(/criar sua conta para conhecer o seu painel/)).toBeVisible();
  await dialog.getByLabel("(11) 99999-8888").fill(`119${Date.now().toString().slice(-8)}`);
  await dialog.getByRole("button", { name: "Enviar", exact: true }).click();
  await dialog.getByLabel("seu@email.com").fill(email);
  await dialog.getByRole("button", { name: "Enviar", exact: true }).click();
  const before = codes(email).length;
  await dialog.getByRole("button", { name: "Aceito, enviar o código" }).click();
  await expect.poll(() => codes(email).length).toBeGreaterThan(before);
  await dialog.getByLabel("Código de 4 números").fill(codes(email)[0]!);
  await dialog.getByRole("button", { name: "Enviar", exact: true }).click();

  // The session starts: one step to the panel.
  await expect(page.getByRole("heading", { name: "Sua conta está criada! 🎉" })).toBeVisible();
  await expect(page.getByText(new RegExp(`/${slug}$`))).toBeVisible();
  await page.getByRole("link", { name: "Conhecer meu painel" }).click();

  // The panel tutorial is mandatory: no "Pular tutorial", only forward.
  const tour = page.getByTestId("tour");
  await expect(tour.getByText("Este é o seu painel! 👋")).toBeVisible();
  await expect(tour.getByRole("button", { name: "Pular tutorial" })).toHaveCount(0);
  await expect(page.getByText(/Teste do Completo/)).toHaveCount(0);
  await tour.getByRole("button", { name: "Começar" }).click();
  const tap = async (id: string) => {
    const target = page.locator(`[data-tour="${id}"]:visible`).first();
    await expect(tour).toBeVisible();
    await target.click();
  };
  await tap("nav-agenda");
  await expect(tour.getByText("Aqui caem os agendamentos")).toBeVisible();
  await tour.getByRole("button", { name: "Próximo" }).click();
  await tap("nav-more");
  await tap("nav-configuracoes");
  await expect(tour.getByText("Dias e horários de atendimento")).toBeVisible();
  await tour.getByRole("button", { name: "Próximo" }).click();
  await tap("nav-inicio");
  await expect(tour.getByText("Seu link de agendamento")).toBeVisible();
  await tap("link-copy");
  await expect(tour.getByText("Veja como seus clientes veem")).toBeVisible();
  // The chat opens over the panel (never in another tab, where she could get lost).
  await tap("view-chat");
  const preview = page.getByRole("dialog", { name: "É assim que seus clientes veem" });
  await expect(preview.frameLocator("iframe").getByText(/Você está na agenda de/)).toBeVisible();
  expect(page.context().pages()).toHaveLength(1);
  await preview.getByRole("button", { name: "Continuar" }).click();

  // Last step: the payment, with the two plans.
  await expect(tour.getByText("Ative sua agenda 🚀")).toBeVisible();
  await expect(tour.getByRole("button", { name: "Pular tutorial" })).toHaveCount(0);
  await page.screenshot({ path: path.join(shots, "tutorial-pagamento.png") });
  await tour.getByRole("button", { name: /Site \+ Agenda/ }).click();

  // The Pix page, with the plan chosen in the tutorial.
  await expect(page).toHaveURL(/\/ativar\?plano=site/);
  await expect(page.getByRole("heading", { name: "Falta só ativar! 🚀" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Site \+ Agenda/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("button", { name: /^Completo/ }).click();
  await page.screenshot({ path: path.join(shots, "pagamento.png"), fullPage: true });

  // The panel is closed until she pays, and the link hands off to the WhatsApp.
  const client = await page.context().newPage();
  await client.goto(`/${slug}?brand=barber`);
  await expect(
    client.getByRole("link", { name: /Agende também com o MeetChat/ }).first(),
  ).toBeVisible();
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

test("a name of another niche wins over the ad's niche (Mara Nail from a beauty ad)", async ({
  page,
}) => {
  await page.goto("/ativar?area=beleza");
  await page.getByRole("link", { name: "Quero o meu" }).click();
  const dialog = page.locator("[data-creation]");
  await dialog.getByLabel("Nome do negócio").fill(`Mara Nail ${unique()}`);
  await page.waitForTimeout(1600);
  await dialog.getByRole("button", { name: "Enviar", exact: true }).click();
  // Asked about nails (not built as a beauty salon right away).
  await expect(dialog.getByText(/você trabalha com manicure, certo\?/i)).toBeVisible();
  await dialog.getByRole("button", { name: "Isso mesmo" }).click();
  await expect(dialog.getByText(/criar sua conta para conhecer o seu painel/)).toBeVisible();
});

test("the ad's niche is used when the name says nothing else", async ({ page }) => {
  await page.goto("/ativar?area=beleza");
  await page.getByRole("link", { name: "Quero o meu" }).click();
  const dialog = page.locator("[data-creation]");
  await dialog.getByLabel("Nome do negócio").fill(`Espaço Carla ${unique()}`);
  await page.waitForTimeout(1600);
  await dialog.getByRole("button", { name: "Enviar", exact: true }).click();
  await expect(dialog.getByText(/criar sua conta para conhecer o seu painel/)).toBeVisible();
  await expect(dialog.getByText(/trabalha com/)).toHaveCount(0);
});
