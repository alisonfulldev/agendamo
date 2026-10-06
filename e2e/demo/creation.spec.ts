import { expect, test, type Page } from "@playwright/test";

/** Creation conversation of the home page (opens over the site). */

async function typeName(page: Page, name: string) {
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Nome do negócio").fill(name);
  // The conversation takes a few seconds for people (anti-robot minimum time).
  await page.waitForTimeout(1600);
  await dialog.getByRole("button", { name: "Enviar" }).click();
}

async function testBooking(page: Page) {
  const dialog = page.getByRole("dialog");
  await dialog.locator("button").filter({ hasText: /·/ }).first().click();
  await dialog.getByRole("button", { name: /^Hoje/ }).click();
  await dialog
    .locator("button")
    .filter({ hasText: /^\d{2}:\d{2}$/ })
    .first()
    .click();
  await expect(dialog.getByText("É isso que chega para você:")).toBeVisible();
  await expect(dialog.getByText("Novo agendamento")).toBeVisible();
}

test("CTA opens the conversation over the site; back closes it", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Criar meu link grátis" }).first().click();
  await expect(page).toHaveURL(/\?criar=1/);
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByText("Oi! Vamos montar seu link de agendamento?")).toBeVisible();
  await page.goBack();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  // The site is still there behind it.
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("niche detected from the name, transformation, test booking and “Quero esse link”", async ({
  page,
}) => {
  await page.goto("/?criar=1");
  const dialog = page.getByRole("dialog");
  // Shortcuts answer and the conversation goes on.
  await dialog.getByRole("button", { name: "Quanto custa?" }).click();
  await expect(dialog.getByText(/30 dias grátis, sem cartão\. Depois, R\$ 19\/mês/)).toBeVisible();

  const name = `Barbearia Navalha Teste ${Date.now().toString(36)}`;
  await typeName(page, name);
  await expect(dialog.getByText(/você trabalha com barbearia, certo\?/)).toBeVisible();
  await dialog.getByRole("button", { name: "Isso mesmo" }).click();

  await expect(
    dialog.getByText("Agora você é sua cliente. Faça um agendamento de teste."),
  ).toBeVisible();
  await expect(dialog.getByRole("banner")).toContainText(name);
  await expect(dialog.getByText(/Você está na agenda de/)).toBeVisible();
  await testBooking(page);

  // The sign-up goes on in the conversation (see signup-code.spec.ts).
  await dialog.getByRole("button", { name: "Quero esse link para mim" }).click();
  await expect(dialog.getByText(/Qual o seu WhatsApp\?/)).toBeVisible();
});

test("name not recognized: chips, “Outro” and the neutral chat", async ({ page }) => {
  await page.goto("/?criar=1");
  const dialog = page.getByRole("dialog");
  await typeName(page, "Ateliê Dona Rosa");
  await expect(dialog.getByText("O que você faz?")).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Sobrancelha" })).toBeVisible();
  await dialog.getByRole("button", { name: "Outro" }).click();
  await expect(dialog.getByText("Me conta em poucas palavras o que você faz.")).toBeVisible();
  await dialog.getByLabel(/Ex\.: restauro móveis/).fill("Restauro móveis antigos");
  await dialog.getByRole("button", { name: "Enviar" }).click();
  await expect(dialog.getByText(/Qual atendimento você quer agendar\?/)).toBeVisible();
  await expect(dialog.getByRole("button", { name: /Primeiro atendimento/ })).toBeVisible();
});

test("“Ver todos” lists every niche", async ({ page }) => {
  await page.goto("/?criar=1");
  const dialog = page.getByRole("dialog");
  await typeName(page, "Espaço Luz");
  await dialog.getByRole("button", { name: "Ver todos" }).click();
  await dialog.getByRole("button", { name: "Banho e tosa" }).click();
  await expect(dialog.getByRole("button", { name: /Banho e tosa ·/ })).toBeVisible();
});

test("prospecting link ?nome=&ramo= skips the answered questions", async ({ page }) => {
  await page.goto("/?nome=Studio%20Ana%20Brow&ramo=cilios-e-sobrancelhas");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByText("Agora você é sua cliente. Faça um agendamento de teste."),
  ).toBeVisible();
  await expect(dialog.getByRole("banner")).toContainText("Studio Ana Brow");
  await expect(dialog.getByText("O que você faz?")).toHaveCount(0);
});

test("closing and reopening resumes where it stopped", async ({ page }) => {
  await page.goto("/?criar=1");
  const dialog = page.getByRole("dialog");
  await typeName(page, "Barbearia Retomada");
  await dialog.getByRole("button", { name: "Isso mesmo" }).click();
  await expect(dialog.getByText("Agora você é sua cliente.", { exact: false })).toBeVisible();
  await dialog.getByRole("button", { name: "Fechar" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);

  await page.getByRole("link", { name: "Criar meu link grátis" }).first().click();
  await expect(page.getByText("Quer continuar de onde parou, Barbearia Retomada?")).toBeVisible();
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.getByRole("dialog").getByRole("banner")).toContainText("Barbearia Retomada");
  await testBooking(page);
});
