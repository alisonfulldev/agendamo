import { readFileSync } from "node:fs";
import path from "node:path";

import { expect, test, type Page } from "@playwright/test";

/** Key flows in demo mode, checking the e-mails captured in .demo-data/emails.json. */
interface CapturedEmail {
  to: string[];
  subject: string;
  html: string;
}

function emailsTo(address: string): CapturedEmail[] {
  try {
    const all = JSON.parse(
      readFileSync(path.join(process.cwd(), ".demo-data", "emails.json"), "utf8"),
    ) as CapturedEmail[];
    return all.filter((email) => email.to.includes(address));
  } catch {
    return [];
  }
}

const unique = () => Date.now().toString(36);

/** Puts a business in a known plan state through /demo (tests must not depend on each other). */
async function setPlan(
  page: Page,
  business: string,
  label: "Em teste (30 dias)" | "Assinante" | "Teste encerrado",
) {
  await page.goto("/demo#planos");
  await page
    .locator("#planos form", { hasText: business })
    .getByRole("button", { name: label })
    .click();
  await page.waitForURL(/ok=plano/);
}

test("sign up, confirm by the e-mail link and reach the business wizard", async ({ page }) => {
  const email = `teste-${unique()}@exemplo.com`;
  await page.goto("/cadastro?brand=barber");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill("senha-forte-123");
  await page.locator("#terms").click();
  await page.getByRole("button", { name: "Criar conta grátis" }).click();
  await expect(page.getByText(/Enviamos um link de confirmação/)).toBeVisible();

  await expect.poll(() => emailsTo(email).length).toBe(1);
  const link = /href="([^"]*\/auth\/confirm[^"]*)"/.exec(emailsTo(email)[0]!.html)?.[1];
  expect(link).toBeTruthy();
  await page.goto(link!.replace(/&amp;/g, "&"));
  await expect(page).toHaveURL(/\/painel\/novo/);

  // The wizard starts at the business name: the segment comes from the brand.
  const slug = `barbearia-${unique()}`;
  await expect(page.getByText("Passo 1 de 4")).toBeVisible();
  await page.getByLabel("Nome do negócio").fill("Barbearia Teste");
  await page.getByLabel("Seu link").fill(slug);
  await expect(page.getByText("Disponível!")).toBeVisible();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByLabel("WhatsApp").fill("11999998888");
  await page.getByLabel("Cidade").fill("São Paulo");
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.locator("button", { hasText: /^\+ / }).first().click();
  await page.getByLabel("Preço (R$)").first().fill("45");
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("button", { name: /Criar meu chat de agendamento/ }).click();
  await expect(
    page.getByRole("heading", { name: "Seu chat de agendamento está no ar!" }),
  ).toBeVisible();
  // Right after the wizard, the panel opens with its header and menu.
  await page.getByRole("button", { name: "Ir para o painel" }).click();
  await expect(page.getByRole("navigation", { name: "Painel" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Agenda" })).toBeVisible();
  await page.goto(`/${slug}?brand=barber`);
  await expect(page.getByRole("heading", { name: /Agendar com Barbearia Teste/ })).toBeAttached();
});

test("pick the chat link on the home: it is checked and comes filled in the wizard", async ({
  page,
}) => {
  const slug = `meu-espaco-${unique()}`;
  await page.goto("/");
  await page.getByLabel("Escolha o link do seu chat").fill(slug);
  await expect(page.getByText(`${slug} está livre!`)).toBeVisible();
  // A taken link is refused with a free suggestion.
  await page.getByLabel("Escolha o link do seu chat").fill("studio-bela");
  await expect(page.getByText("Esse endereço já está em uso.")).toBeVisible();
  await page.getByLabel("Escolha o link do seu chat").fill(slug);
  await expect(page.getByText(`${slug} está livre!`)).toBeVisible();
  await page.getByRole("button", { name: "Criar meu chat" }).click();

  await expect(page).toHaveURL(/\/comecar/);
  await page.getByRole("link", { name: /Barbearias e barbeiros/ }).click();
  const email = `link-${unique()}@exemplo.com`;
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill("senha-forte-123");
  await page.locator("#terms").click();
  await page.getByRole("button", { name: "Criar conta grátis" }).click();
  await expect.poll(() => emailsTo(email).length).toBe(1);
  const link = /href="([^"]*\/auth\/confirm[^"]*)"/.exec(emailsTo(email)[0]!.html)?.[1];
  await page.goto(link!.replace(/&amp;/g, "&"));
  await expect(page).toHaveURL(/\/painel\/novo/);
  await expect(page.getByLabel("Seu link")).toHaveValue(slug);
  await expect(page.getByText("Disponível!")).toBeVisible();
});

test("a failed load of the free times never leaves the chat on “digitando…”", async ({ page }) => {
  // The first request for the day's times fails (as on a bad connection).
  let failed = false;
  await page.route("**/studio-bela**", async (route) => {
    const request = route.request();
    const body = request.postData() ?? "";
    const isSlots =
      request.method() === "POST" &&
      request.headers()["next-action"] &&
      body.includes('"date"') &&
      !body.includes('"startsAt"') &&
      !body.includes('"name"');
    if (isSlots && !failed) {
      failed = true;
      await route.abort("failed");
      return;
    }
    await route.continue();
  });

  await page.goto("/studio-bela?brand=beauty");
  await page
    .getByRole("button", { name: /Manicure/ })
    .first()
    .click();
  await page
    .getByRole("button", { name: /, \d{1,2} de [a-zç]+$/i })
    .first()
    .click();
  await expect(
    page.getByText("Não consegui carregar os horários agora.", { exact: false }),
  ).toBeVisible();
  expect(failed).toBe(true);

  await page.getByRole("button", { name: "Tentar de novo" }).click();
  await expect(
    page
      .locator("button")
      .filter({ hasText: /^\d{2}:\d{2}$/ })
      .first(),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Tentar de novo" })).toHaveCount(0);
});

test("book through the chat: customer and owner get e-mails", async ({ page }) => {
  const email = `cliente-${unique()}@exemplo.com`;
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
    .first()
    .click();
  await page.getByLabel("Seu nome").fill("Cliente Demo");
  await page.getByRole("button", { name: "Enviar" }).click();
  await page.getByLabel("WhatsApp").fill(`119${Date.now().toString().slice(-8)}`);
  await page.getByRole("button", { name: "Enviar" }).click();
  await page.getByLabel("E-mail").fill(email);
  await page.getByRole("button", { name: "Enviar" }).click();
  const noCoupon = page.getByRole("button", { name: "Não tenho" });
  if (await noCoupon.isVisible().catch(() => false)) await noCoupon.click();
  await page.getByRole("button", { name: "Confirmar agendamento" }).click();
  // The customer's answer to the summary stays in the conversation.
  await expect(page.getByText(/^Confirmar agendamento\s/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Confirmar agendamento" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Google Agenda" })).toHaveAttribute(
    "href",
    /calendar\.google\.com\/calendar\/render\?action=TEMPLATE/,
  );
  await expect(page.getByRole("link", { name: "Calendário do iPhone" })).toHaveAttribute(
    "href",
    /\/api\/ics\//,
  );

  await expect.poll(() => emailsTo(email).length).toBeGreaterThan(0);
  await expect
    .poll(
      () =>
        emailsTo("dona.beleza@demo.com").filter((e) => e.subject.includes("Cliente Demo")).length,
    )
    .toBeGreaterThan(0);
});

test("right after booking, the chat offers to book the next visit in two taps", async ({
  page,
}) => {
  await setPlan(page, "Studio Bela", "Assinante");
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
    .first()
    .click();
  await page.getByLabel("Seu nome").fill("Cliente Retorno");
  await page.getByRole("button", { name: "Enviar" }).click();
  await page.getByLabel("WhatsApp").fill(`1197${Date.now().toString().slice(-7)}`);
  await page.getByRole("button", { name: "Enviar" }).click();
  await page.getByRole("button", { name: "Prefiro não informar" }).click();
  const noCoupon = page.getByRole("button", { name: "Não tenho" });
  if (await noCoupon.isVisible().catch(() => false)) await noCoupon.click();
  await page.getByRole("button", { name: "Confirmar agendamento" }).click();

  // Manicure returns in 15 days: the offer shows up after the confirmation.
  await expect(page.getByText(/Quer já deixar o próximo Manicure marcado\?/)).toBeVisible();
  await expect(page.getByText(/cerca de 15 dias/)).toBeVisible();
  await page.getByRole("button", { name: "Sim, ver horários" }).click();
  await page
    .getByRole("button", { name: /, \d{1,2} de [a-zç]+$/i })
    .first()
    .click();
  await page
    .locator("button")
    .filter({ hasText: /^\d{2}:\d{2}$/ })
    .first()
    .click();
  await expect(page.getByText(/Seu próximo horário ficou para/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Calendário do iPhone" })).toHaveCount(2);
});

test("owner reschedules: the panel offers a ready WhatsApp message to tell the customer", async ({
  page,
}) => {
  await setPlan(page, "Studio Bela", "Assinante");
  const customer = `Remarcar ${unique()}`;
  await page.goto("/studio-bela?brand=beauty");
  await page
    .getByRole("button", { name: /Escova/ })
    .first()
    .click();
  const day = page.getByRole("button", { name: /, \d{1,2} de [a-zç]+$/i }).first();
  const dayLabel = (await day.textContent()) ?? "";
  await day.click();
  await page
    .locator("button")
    .filter({ hasText: /^\d{2}:\d{2}$/ })
    .first()
    .click();
  await page.getByLabel("Seu nome").fill(customer);
  await page.getByRole("button", { name: "Enviar" }).click();
  await page.getByLabel("WhatsApp").fill(`1196${Date.now().toString().slice(-7)}`);
  await page.getByRole("button", { name: "Enviar" }).click();
  await page.getByRole("button", { name: "Prefiro não informar" }).click();
  const noCoupon = page.getByRole("button", { name: "Não tenho" });
  if (await noCoupon.isVisible().catch(() => false)) await noCoupon.click();
  await page.getByRole("button", { name: "Confirmar agendamento" }).click();
  await expect(page.getByRole("link", { name: "Calendário do iPhone" }).first()).toBeVisible();

  // "segunda-feira, 5 de outubro" -> yyyy-mm-dd (this year or the next).
  const months = [
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
  ];
  const [, d, m] = /(\d{1,2}) de ([a-zç]+)/i.exec(dayLabel)!;
  const now = new Date();
  const month = months.indexOf(m!.toLowerCase());
  const year = month < now.getMonth() ? now.getFullYear() + 1 : now.getFullYear();
  const date = `${year}-${String(month + 1).padStart(2, "0")}-${d!.padStart(2, "0")}`;

  await page.goto("/demo");
  await page
    .locator("form", { hasText: "dona.beleza@demo.com" })
    .getByRole("button", { name: "Entrar" })
    .click();
  await page.waitForURL(/\/painel/);
  await page.goto(`/painel/agenda?date=${date}`);
  await page
    .getByRole("button", { name: new RegExp(customer) })
    .first()
    .click();
  await page.getByRole("button", { name: "Remarcar" }).click();
  await page.getByRole("radiogroup", { name: "Horários livres" }).getByRole("radio").last().click();
  await page.getByRole("button", { name: "Confirmar novo horário" }).click();

  await expect(page.getByText(/não deixou e-mail: avise pelo WhatsApp/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Avisar pelo WhatsApp" })).toHaveAttribute(
    "href",
    /wa\.me\/55\d+\?text=.*remarcado/,
  );
});

test("trial ended: the chat ends on the owner's WhatsApp and the panel only opens the plan", async ({
  page,
}) => {
  await setPlan(page, "Barbearia Navalha", "Teste encerrado");
  await page.goto("/barbearia-navalha?brand=barber");
  await page.getByRole("button", { name: "Corte", exact: true }).click();
  await page
    .getByRole("button", { name: /, \d{1,2} de [a-zç]+$/i })
    .first()
    .click();
  await page
    .locator("button")
    .filter({ hasText: /^\d{2}:\d{2}$/ })
    .first()
    .click();
  await page.getByLabel("Seu nome").fill("Cliente WhatsApp");
  await page.getByRole("button", { name: "Enviar" }).click();
  await page.getByRole("button", { name: "Sem recado" }).click();
  const send = page.getByRole("link", { name: "Enviar pelo WhatsApp" });
  await expect(send).toHaveAttribute("href", /wa\.me\/55\d+\?text=.*Corte/);

  await page.goto("/demo");
  await page
    .locator("form", { hasText: "dono.barbearia@demo.com" })
    .getByRole("button", { name: "Entrar" })
    .click();
  await page.waitForURL(/\/painel\/plano/);
  await expect(page.getByText("Seu teste grátis terminou")).toBeVisible();
  await page.goto("/painel/agenda");
  await expect(page).toHaveURL(/\/painel\/plano/);
});

test("finance: automatic revenues, a new cost and the month's profit", async ({ page }) => {
  await page.goto("/demo");
  await page
    .locator("form", { hasText: "dona.beleza@demo.com" })
    .getByRole("button", { name: "Entrar" })
    .click();
  await page.waitForURL(/\/painel/);
  await page.goto("/painel/financeiro");
  // The sample appointments and costs are in previous months.
  await page.getByRole("link", { name: "Mês anterior" }).click();
  await page.waitForURL(/mes=/);
  await expect(page.getByText("automático").first()).toBeVisible();
  await expect(page.getByText("Aluguel").first()).toBeVisible();

  const description = `Cera ${unique()}`;
  await page.getByRole("button", { name: "Lançar custo" }).click();
  await page.getByLabel("Descrição").fill(description);
  await page.getByLabel("Categoria").selectOption("Produtos e materiais");
  await page.getByLabel("Valor (R$)").fill("12,50");
  await page.getByRole("button", { name: "Salvar" }).click();
  const row = page.locator("li", { hasText: description });
  await expect(row).toContainText("12,50");

  page.once("dialog", (dialog) => void dialog.accept());
  await row.getByRole("button", { name: `Excluir ${description}` }).click();
  await expect(page.locator("li", { hasText: description })).toHaveCount(0);
});

test("booking without e-mail: the e-mail is optional and not mentioned at the end", async ({
  page,
}) => {
  await page.goto("/movimento-fisio?brand=physio");
  await page
    .getByRole("button", { name: /Pilates clínico/ })
    .first()
    .click();
  await page
    .getByRole("button", { name: /, \d{1,2} de [a-zç]+$/i })
    .first()
    .click();
  await page
    .locator("button")
    .filter({ hasText: /^\d{2}:\d{2}$/ })
    .first()
    .click();
  await page.getByLabel("Seu nome").fill("Paciente Sem Email");
  await page.getByRole("button", { name: "Enviar" }).click();
  await page.getByLabel("WhatsApp").fill(`119${Date.now().toString().slice(-8)}`);
  await page.getByRole("button", { name: "Enviar" }).click();
  await page.getByRole("button", { name: "Prefiro não informar" }).click();
  const noCoupon = page.getByRole("button", { name: "Não tenho" });
  if (await noCoupon.isVisible().catch(() => false)) await noCoupon.click();
  await page.getByRole("button", { name: "Confirmar agendamento" }).click();
  const done = page.getByText(/Seu horário está confirmado/);
  await expect(done).toBeVisible();
  await expect(done).not.toContainText("e-mail");
});

test("signed in on another brand: sign-up shows the account in use and lets you switch", async ({
  page,
}) => {
  await page.goto("/demo");
  await page
    .locator("form", { hasText: "dona.beleza@demo.com" })
    .getByRole("button", { name: "Entrar" })
    .click();
  await page.waitForURL(/\/painel/);
  await page.goto("/psicologia");
  await page.getByRole("link", { name: "Testar 30 dias grátis" }).first().click();
  await expect(page).toHaveURL(/\/cadastro/);
  await expect(page.getByText("dona.beleza@demo.com")).toBeVisible();
  await page.getByRole("button", { name: "Sair e usar outra conta" }).click();
  await expect(page).toHaveURL(/\/cadastro/);
  await expect(page.getByRole("button", { name: "Criar conta grátis" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-brand", "psychology");
});

test("own checkout: Pix QR inside the panel, the payment activates the subscription", async ({
  page,
}) => {
  await setPlan(page, "Barbearia Navalha", "Teste encerrado");
  await page.goto("/demo");
  await page
    .locator("form", { hasText: "dono.barbearia@demo.com" })
    .getByRole("button", { name: "Entrar" })
    .click();
  await page.waitForURL(/\/painel\/plano/);
  await page.getByLabel(/Nome ou razão social/).fill("Barbearia Navalha LTDA");
  await page.getByLabel("CPF ou CNPJ").fill("529.982.247-25");
  await page.getByRole("button", { name: /^Gerar Pix de/ }).click();
  await expect(page.getByRole("img", { name: "QR code do Pix" })).toBeVisible();
  await expect(page.getByText(/Aguardando o pagamento/)).toBeVisible();

  // The Asaas webhook confirms the payment (simulated in demo mode).
  const confirm = await page.context().newPage();
  await confirm.goto("/demo#assinaturas");
  await confirm
    .locator("form", { hasText: "Barbearia Navalha" })
    .filter({ has: confirm.getByRole("button", { name: "Confirmar pagamento" }) })
    .first()
    .getByRole("button", { name: "Confirmar pagamento" })
    .click();
  await expect(confirm.getByText(/Pagamento confirmado: a assinatura foi ativada/)).toBeVisible();

  await expect(page.getByText("Pagamento confirmado! 🎉")).toBeVisible({ timeout: 20_000 });
  await page.goto("/painel/agenda");
  await expect(page).toHaveURL(/\/painel\/agenda/);
});

test("own checkout: card refused shows the error, a valid card is accepted", async ({ page }) => {
  await page.goto("/demo");
  await page
    .locator("form", { hasText: "psi@demo.com" })
    .getByRole("button", { name: "Entrar" })
    .click();
  await page.waitForURL(/\/painel/);
  await page.goto("/painel/plano");
  await page.getByLabel(/Nome ou razão social/).fill("Espaço Escuta");
  await page.getByLabel("CPF ou CNPJ").fill("529.982.247-25");
  await page.getByRole("button", { name: /Cartão de crédito/ }).click();
  const fill = async (number: string) => {
    await page.getByLabel("Número do cartão").fill(number);
    await page.getByLabel("Nome impresso no cartão").fill("ANA PSI");
    await page.getByLabel("Validade (MM/AA)").fill("12/30");
    await page.getByLabel("Código (CVV)").fill("123");
    await page.getByLabel("Telefone com DDD").fill("31999990004");
    await page.getByLabel("CEP da fatura do cartão").fill("30140-071");
    await page.getByLabel("Número do endereço").fill("800");
    await page.getByRole("button", { name: /no cartão$/ }).click();
  };
  await fill("4000 0000 0000 0000".replace(/0000$/, "0000"));
  await expect(page.getByRole("alert").filter({ hasText: /cart/i }).first()).toBeVisible();
  await fill("4111 1111 1111 1111");
  await expect(page.getByText(/Confirmando o pagamento com o cartão/)).toBeVisible();
});
