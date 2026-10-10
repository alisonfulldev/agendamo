import { expect, test, type Page } from "@playwright/test";

/** Creation conversation of the home page (opens over the site). */

async function typeName(page: Page, name: string) {
  const dialog = page.locator("[data-creation]");
  await dialog.getByLabel("Nome do negócio").fill(name);
  // The conversation takes a few seconds for people (anti-robot minimum time).
  await page.waitForTimeout(1600);
  await dialog.getByRole("button", { name: "Enviar" }).click();
}

/** "Ver como meu cliente vai agendar": from the choice screen to the simulation. */
async function openSimulation(page: Page) {
  const dialog = page.locator("[data-creation]");
  await dialog.getByRole("button", { name: "Ver como meu cliente vai agendar" }).click();
  await expect(
    dialog.getByText("Simulação: é assim que seu cliente vai agendar.", { exact: false }),
  ).toBeVisible();
}

async function testBooking(page: Page) {
  const dialog = page.locator("[data-creation]");
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

test("phone: the top chat plays the demo, asks the name and becomes the creation conversation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  // Never empty: the first balloon comes from the server.
  await expect(page.getByText(/Você está na agenda de Studio Lumi/)).toBeVisible();
  // The short demo ends on the owner's notification, then the name question is ready.
  await expect(page.getByText(/Novo agendamento: Ana, sábado 10h/)).toBeVisible();
  await expect(page.getByText(/Qual o nome dele\?/)).toBeVisible();
  const name = page.getByLabel("Nome do negócio");
  await name.fill(`Barbearia Topo ${Date.now().toString(36)}`);
  await page.waitForTimeout(1600);
  await name.press("Enter");
  // The conversation goes on inside the top (no overlay, no new address).
  const chat = page.locator("[data-creation]");
  await expect(chat.getByText(/você trabalha com barbearia, certo\?/)).toBeVisible();
  await expect(page).not.toHaveURL(/criar=1/);
  await page.getByRole("button", { name: "Recolher" }).click();
  await expect(chat).toBeVisible();
});

test("calls to action of the page scroll to the top chat and activate the name field", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("heading", { name: /Perguntas frequentes/ }).scrollIntoViewIfNeeded();
  await page.getByRole("link", { name: "Criar meu link grátis" }).last().click();
  await expect(page.getByLabel("Nome do negócio")).toBeFocused();
  await expect(page.getByText(/Qual o nome dele\?/)).toBeVisible();
});

test("niche detected from the name, transformation, test booking and “Criar minha conta grátis”", async ({
  page,
}) => {
  await page.goto("/?criar=1");
  const dialog = page.locator("[data-creation]");
  // Shortcuts answer and the conversation goes on.
  await dialog.getByRole("button", { name: "Quanto custa?" }).click();
  await expect(
    dialog.getByText(/Grátis para sempre com 10 agendamentos por mês\. Agenda: R\$ 19,90\/mês/),
  ).toBeVisible();

  const name = `Barbearia Navalha Teste ${Date.now().toString(36)}`;
  await typeName(page, name);
  await expect(dialog.getByText(/você trabalha com barbearia, certo\?/)).toBeVisible();
  await dialog.getByRole("button", { name: "Isso mesmo" }).click();
  // Loading screen before her chat shows up.
  await expect(dialog.getByText("Estamos criando seu chat…")).toBeVisible();

  await expect(
    dialog.getByText("Seu chat de agendamento está pronto para ser criado", { exact: false }),
  ).toBeVisible();
  await expect(dialog.locator("header")).toContainText(name);
  // The choice screen: no booking is started before she asks for the simulation.
  await expect(dialog.getByText(/Você está na agenda de/)).toHaveCount(0);
  await openSimulation(page);
  await expect(dialog.getByText(/Você está na agenda de/)).toBeVisible();
  await testBooking(page);
  await expect(dialog.getByText("Isso foi só uma simulação.", { exact: false })).toBeVisible();

  // The sign-up goes on in the conversation (see signup-code.spec.ts).
  await dialog.getByRole("button", { name: "Criar minha conta grátis" }).click();
  await expect(dialog.getByText(/Qual o seu WhatsApp\?/)).toBeVisible();
});

test("name not recognized: chips, “Outro” and the neutral chat", async ({ page }) => {
  await page.goto("/?criar=1");
  const dialog = page.locator("[data-creation]");
  await typeName(page, "Ateliê Dona Rosa");
  await expect(dialog.getByText("O que você faz?")).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Sobrancelha" })).toBeVisible();
  await dialog.getByRole("button", { name: "Outro" }).click();
  await expect(dialog.getByText("Me conta em poucas palavras o que você faz.")).toBeVisible();
  await dialog.getByLabel(/Ex\.: restauro móveis/).fill("Restauro móveis antigos");
  await dialog.getByRole("button", { name: "Enviar" }).click();
  await openSimulation(page);
  await expect(dialog.getByText(/Qual atendimento você quer agendar\?/)).toBeVisible();
  await expect(dialog.getByRole("button", { name: /Primeiro atendimento/ })).toBeVisible();
});

test("“Ver todos” lists every niche", async ({ page }) => {
  await page.goto("/?criar=1");
  const dialog = page.locator("[data-creation]");
  await typeName(page, "Espaço Luz");
  await dialog.getByRole("button", { name: "Ver todos" }).click();
  await dialog.getByRole("button", { name: "Banho e tosa" }).click();
  await openSimulation(page);
  await expect(dialog.getByRole("button", { name: /Banho e tosa ·/ })).toBeVisible();
});

test("prospecting link ?nome=&ramo= skips the answered questions", async ({ page }) => {
  await page.goto("/?nome=Studio%20Ana%20Brow&ramo=cilios-e-sobrancelhas");
  const dialog = page.locator("[data-creation]");
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByText("Seu chat de agendamento está pronto para ser criado", { exact: false }),
  ).toBeVisible();
  await expect(dialog.locator("header")).toContainText("Studio Ana Brow");
  await expect(dialog.getByText("O que você faz?")).toHaveCount(0);
});

test("closing and reopening resumes where it stopped", async ({ page }) => {
  await page.goto("/?criar=1");
  const dialog = page.locator("[data-creation]");
  await typeName(page, "Barbearia Retomada");
  await dialog.getByRole("button", { name: "Isso mesmo" }).click();
  await expect(dialog.getByText("pronto para ser criado", { exact: false })).toBeVisible();
  // Leaving and coming back (a new visit to the page).
  await page.goto("/");
  await page.getByRole("link", { name: "Criar meu link grátis" }).first().click();
  await expect(page.getByText("Quer continuar de onde parou, Barbearia Retomada?")).toBeVisible();
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.locator("[data-creation]").locator("header")).toContainText(
    "Barbearia Retomada",
  );
  await openSimulation(page);
  await testBooking(page);
});
