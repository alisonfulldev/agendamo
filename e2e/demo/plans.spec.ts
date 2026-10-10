import { readFileSync } from "node:fs";
import path from "node:path";

import { expect, test, type Page } from "@playwright/test";

/** The three plans (Grátis, Agenda, Pro) and the 7-day trial, end to end in demo mode. */

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

const codes = (address: string) =>
  emails(address)
    .filter((e) => e.subject.includes("Seu código"))
    .map((e) => /(\d{4})/.exec(e.subject)?.[1] ?? "");

const unique = () => Date.now().toString(36);

async function setPlan(page: Page, business: string, label: string) {
  await page.goto("/demo#planos");
  await page
    .locator("#planos form", { hasText: business })
    .getByRole("button", { name: label, exact: true })
    .click();
  await page.waitForURL(/ok=plano/);
}

async function signIn(page: Page, email: string) {
  await page.goto("/demo");
  await page.locator("form", { hasText: email }).getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(/\/painel/);
}

async function runJob(page: Page, label: string) {
  await page.goto("/demo#tarefas");
  await page.getByRole("button", { name: label }).click();
  await page.waitForURL(/cron=/);
}

test("trial ends without payment: the account is on Grátis and nothing is deleted", async ({
  page,
}) => {
  await setPlan(page, "Espaço Escuta", "Teste do Agenda");
  await signIn(page, "psi@demo.com");
  await expect(page.getByRole("link", { name: /Teste do Agenda: faltam 7 dias/ })).toBeVisible();
  await page.goto("/painel/clientes");
  const customers = page.locator('a[href^="/painel/clientes/"]');
  await expect(customers.first()).toBeVisible();
  const before = await customers.count();

  // The trial ends (and the daily job sends the notice).
  await setPlan(page, "Espaço Escuta", "Teste encerrado");
  const notices = emails("psi@demo.com").length;
  await runJob(page, "Fim do teste grátis");
  await expect.poll(() => emails("psi@demo.com").length).toBeGreaterThan(notices);
  expect(emails("psi@demo.com")[0]!.subject).toMatch(/Seu teste do Pro terminou/);

  // Panel still opens; paid pages show the lock; the agenda and the chat keep working.
  await page.goto("/painel");
  await expect(page.getByRole("heading", { name: /Plano Grátis: \d+ de 10/ })).toBeVisible();
  await page.goto("/painel/financeiro");
  await expect(page.getByText("Disponível no Agenda e no Pro")).toBeVisible();
  await page.goto("/painel/agenda");
  await expect(page).toHaveURL(/\/painel\/agenda/);
  await page.goto("/espaco-escuta?brand=psychology");
  await expect(page.getByText(/Você está na agenda de/)).toBeVisible();

  // Subscribing brings everything back, with every customer still there.
  await setPlan(page, "Espaço Escuta", "Agenda");
  await signIn(page, "psi@demo.com");
  await page.goto("/painel/clientes");
  await expect(customers.first()).toBeVisible();
  expect(await customers.count()).toBe(before);
});

test("upgrade from Agenda to Pro applies right away", async ({ page }) => {
  await setPlan(page, "Movimento Fisio", "Agenda");
  // The demo subscription of an Agenda account.
  await page.goto("/demo#assinaturas");
  await signIn(page, "fisio@demo.com");
  await page.goto("/painel/plano");
  await expect(page.getByText("Seu plano: Agenda")).toBeVisible();
  await page.getByRole("button", { name: /^Pro\b/ }).click();
  await page.getByRole("button", { name: "Mudar para o Pro agora" }).click();
  await expect(page.getByText(/o Pro já está liberado/)).toBeVisible();
  await page.reload();
  await expect(page.getByText("Seu plano: Pro")).toBeVisible();
});

test("the 7-day trial is used only once per person, even after a reset", async ({ page }) => {
  const name = `Barbearia Teste Único ${unique()}`;
  const email = `unico-${unique()}@gmail.com`;
  await page.goto("/?criar=1");
  const dialog = page.locator("[data-creation]");
  await dialog.getByLabel("Nome do negócio").fill(name);
  await page.waitForTimeout(1600);
  await dialog.getByRole("button", { name: "Enviar", exact: true }).click();
  await dialog.getByRole("button", { name: "Isso mesmo" }).click();
  await dialog.getByRole("button", { name: "Criar minha conta grátis" }).click();
  await dialog.getByRole("button", { name: "Depois" }).click();
  await dialog.getByLabel("seu@email.com").fill(email);
  await dialog.getByRole("button", { name: "Enviar", exact: true }).click();
  await dialog.getByRole("button", { name: /^Começar grátis/ }).click();
  const before = codes(email).length;
  await dialog.getByRole("button", { name: "Aceito, enviar o código" }).click();
  await expect.poll(() => codes(email).length).toBeGreaterThan(before);
  await dialog.getByLabel("Código de 4 números").fill(codes(email)[0]!);
  await dialog.getByRole("button", { name: "Enviar", exact: true }).click();
  await dialog.getByRole("button", { name: "Entrar no meu painel" }).click();
  await page.getByRole("button", { name: "Pular tutorial" }).click();

  // Grátis: the counter, and the trial can be started from the panel once.
  await expect(page.getByRole("heading", { name: /Plano Grátis: 0 de 10/ })).toBeVisible();
  await page.goto("/painel/plano#teste");
  await page.getByRole("button", { name: "Testar o Agenda por 7 dias" }).click();
  await expect(page.getByText("Teste iniciado! Tudo liberado por 7 dias.")).toBeVisible();
  await expect(page.getByRole("link", { name: /Teste do Agenda/ })).toBeVisible();

  // Even if the account is put back to "never tested", the same person gets no second trial.
  const panel = page.url();
  await setPlan(page, name, "Grátis");
  await page.goto(panel);
  await page.getByRole("button", { name: "Testar o Pro por 7 dias" }).click();
  await expect(page.getByText(/O teste grátis já foi usado/)).toBeVisible();
});
