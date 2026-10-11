import { readFileSync } from "node:fs";
import path from "node:path";

import { expect, test, type Page } from "@playwright/test";

/** The single plan (Completo), the 14-day trial and waiting mode, end to end in demo mode. */

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

/** A regular browser (headless user agents are ignored by the anonymous counters). */
const VISITOR_UA =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36";

async function setPlan(
  page: Page,
  business: string,
  label: "Teste do Completo" | "Assinante" | "Modo de espera",
) {
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

/** Creates an account through the conversation; returns the page signed in. */
async function signUp(page: Page, name: string, email: string, phone: string) {
  await page.goto("/?criar=1");
  const dialog = page.locator("[data-creation]");
  await dialog.getByLabel("Nome do negócio").fill(name);
  await page.waitForTimeout(1600);
  await dialog.getByRole("button", { name: "Enviar", exact: true }).click();
  await dialog.getByRole("button", { name: "Isso mesmo" }).click();
  await dialog.getByRole("button", { name: "Criar minha conta grátis" }).click();
  await dialog.getByLabel("(11) 99999-8888").fill(phone);
  await dialog.getByRole("button", { name: "Enviar", exact: true }).click();
  await dialog.getByLabel("seu@email.com").fill(email);
  await dialog.getByRole("button", { name: "Enviar", exact: true }).click();
  const before = codes(email).length;
  await dialog.getByRole("button", { name: "Aceito, enviar o código" }).click();
  await expect.poll(() => codes(email).length).toBeGreaterThan(before);
  await dialog.getByLabel("Código de 4 números").fill(codes(email).at(-1)!);
  await dialog.getByRole("button", { name: "Enviar", exact: true }).click();
  await expect(dialog.getByText(/Sua conta está pronta/)).toBeVisible();
  return dialog;
}

test("trial ends without payment: waiting mode, nothing deleted, subscribing brings it back", async ({
  page,
}) => {
  await setPlan(page, "Espaço Escuta", "Teste do Completo");
  await signIn(page, "psi@demo.com");
  await expect(page.getByRole("link", { name: /Teste do Completo: faltam 14 dias/ })).toBeVisible();
  await page.goto("/painel/clientes");
  const customers = page.locator('a[href^="/painel/clientes/"]');
  await expect(customers.first()).toBeVisible();
  const before = await customers.count();

  // The trial ends: the panel opens only the subscription screen (menu: Assinatura and Conta).
  await setPlan(page, "Espaço Escuta", "Modo de espera");
  await page.goto("/painel");
  await expect(page).toHaveURL(/\/painel\/plano/);
  await expect(page.getByRole("heading", { name: "Seu teste terminou" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Assinar o Completo" })).toBeVisible();
  await page.goto("/painel/clientes");
  await expect(page).toHaveURL(/\/painel\/plano/);
  const menu = page.getByRole("navigation", { name: "Painel" }).first();
  await expect(menu.getByRole("link", { name: "Agenda" })).toHaveCount(0);
  await expect(menu.getByRole("link", { name: "Conta" })).toBeVisible();
  await page.goto("/painel/conta");
  await expect(page).toHaveURL(/\/painel\/conta/);

  // Subscribing brings everything back, with every customer still there.
  await setPlan(page, "Espaço Escuta", "Assinante");
  await signIn(page, "psi@demo.com");
  await page.goto("/painel/clientes");
  await expect(customers.first()).toBeVisible();
  expect(await customers.count()).toBe(before);
  // Subscribers have no MeetChat badge in their chat.
  await page.goto("/espaco-escuta?brand=psychology");
  await expect(page.getByText(/Você está na agenda de/)).toBeVisible();
  await expect(page.getByRole("link", { name: /Agende também com o MeetChat/ })).toHaveCount(0);
});

test("waiting mode: the chat sends the request to WhatsApp and the owner sees how many", async ({
  page,
  browser,
}) => {
  await setPlan(page, "Barbearia Navalha", "Modo de espera");

  // A customer (not signed in) asks for a time: nothing is booked, WhatsApp opens.
  const visitor = await browser.newContext({ userAgent: VISITOR_UA });
  const chat = await visitor.newPage();
  await visitor.route(/wa\.me/, (route) => route.abort());
  await chat.goto("/barbearia-navalha?brand=barber");
  await chat.getByRole("button", { name: "Corte", exact: true }).click();
  await chat
    .getByRole("button", { name: /, \d{1,2} de [a-zç]+$/i })
    .first()
    .click();
  await chat.getByRole("button", { name: "Tarde", exact: true }).click();
  await chat.getByLabel("Seu nome").fill("Cliente Espera");
  await chat.getByRole("button", { name: "Enviar" }).click();
  await chat.getByRole("button", { name: "Sem recado" }).click();
  const sent = chat.waitForRequest((r) => r.url().endsWith("/api/events") && r.method() === "POST");
  await chat.getByRole("link", { name: "Enviar pelo WhatsApp" }).click();
  await sent;
  await expect(
    chat.getByRole("link", { name: /Agende também com o MeetChat/ }).first(),
  ).toBeVisible();
  await visitor.close();

  // The owner's subscription screen counts the customers sent to WhatsApp this month.
  await signIn(page, "dono.barbearia@demo.com");
  await expect(page).toHaveURL(/\/painel\/plano/);
  await expect(
    page.getByText(/Este mês, \d+ (cliente pediu|clientes pediram) horário pelo seu link/),
  ).toBeVisible();
});

test("every sign-up starts with 14 days; the same person gets no second trial", async ({
  page,
  browser,
}) => {
  const phone = `119${Date.now().toString().slice(-8)}`;
  await signUp(page, `Barbearia Teste Um ${unique()}`, `um-${unique()}@gmail.com`, phone);
  await page
    .locator("[data-creation]")
    .getByRole("button", { name: "Entrar no meu painel" })
    .click();
  await page.getByRole("button", { name: "Pular tutorial" }).click();
  await expect(page.getByRole("link", { name: /Teste do Completo: faltam 14 dias/ })).toBeVisible();

  // Another account with the same WhatsApp: no trial, straight to waiting mode.
  const other = await browser.newContext();
  const second = await other.newPage();
  const dialog = await signUp(
    second,
    `Barbearia Teste Dois ${unique()}`,
    `dois-${unique()}@gmail.com`,
    phone,
  );
  await expect(
    dialog.getByText(/O teste grátis já foi usado com este e-mail ou telefone/),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "Entrar no meu painel" }).click();
  await expect(second).toHaveURL(/\/painel\/plano/);
  await expect(second.getByRole("heading", { name: "O teste grátis já foi usado" })).toBeVisible();
  await other.close();
});
