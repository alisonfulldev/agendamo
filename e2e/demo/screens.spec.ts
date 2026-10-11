import { expect, test, type Page } from "@playwright/test";

/**
 * Opens every screen as each demo persona and fails on server errors, error pages or uncaught
 * browser errors. Runs only against `npm run dev:demo` (playwright.demo.config.ts).
 */
const PANEL_PATHS = [
  "/painel",
  "/painel/agenda",
  "/painel/pedidos",
  "/painel/clientes",
  "/painel/pagina",
  "/painel/vendas",
  "/painel/vendas/pacotes",
  "/painel/vendas/cupons",
  "/painel/vendas/lista-espera",
  "/painel/vendas/quase-agendaram",
  "/painel/vendas/indicacoes",
  "/painel/vendas/reativacao",
  "/painel/vendas/artes",
  "/painel/avaliacoes",
  "/painel/estatisticas",
  "/painel/radar",
  "/painel/equipe",
  "/painel/integracoes",
  "/painel/plano",
  "/painel/financeiro",
  "/painel/configuracoes",
  "/painel/notificacoes",
  "/painel/conta",
];

// Barbearia Navalha is in waiting mode (its own test below).
const OWNERS = ["dona.beleza@demo.com", "dona.estetica@demo.com", "psi@demo.com", "fisio@demo.com"];

function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("response", (response) => {
    if (response.status() >= 500) errors.push(`${response.status()} ${response.url()}`);
  });
  return errors;
}

async function signInAs(page: Page, email: string) {
  await page.goto("/demo");
  await page.locator("form", { hasText: email }).getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(/\/(painel|admin)/);
}

async function visit(page: Page, path: string, errors: string[]) {
  const response = await page.goto(path);
  expect(response?.status(), path).toBeLessThan(400);
  await expect(page.getByText("Algo deu errado.")).toHaveCount(0);
  expect(errors, path).toEqual([]);
}

for (const email of OWNERS) {
  test(`panel screens · ${email}`, async ({ page }) => {
    const errors = watchErrors(page);
    await signInAs(page, email);
    for (const path of PANEL_PATHS) await visit(page, path, errors);
    // First customer's detail page.
    await page.goto("/painel/clientes");
    const customer = page.locator('a[href^="/painel/clientes/"]:not([href$="/exportar"])').first();
    if (await customer.count()) {
      await customer.click();
      await page.waitForURL(/\/painel\/clientes\/[0-9a-f-]{36}/);
      expect(errors).toEqual([]);
    }
  });
}

test("staff member sees the panel", async ({ page }) => {
  const errors = watchErrors(page);
  await signInAs(page, "equipe.estetica@demo.com");
  for (const path of ["/painel", "/painel/agenda", "/painel/clientes", "/painel/conta"]) {
    await visit(page, path, errors);
  }
});

test("waiting mode: only the subscription and the account open", async ({ page }) => {
  const errors = watchErrors(page);
  await signInAs(page, "dono.barbearia@demo.com");
  await expect(page).toHaveURL(/\/painel\/plano/);
  for (const path of ["/painel/plano", "/painel/conta"]) await visit(page, path, errors);
});

test("admin and new account", async ({ page }) => {
  const errors = watchErrors(page);
  await signInAs(page, "admin@demo.com");
  await visit(page, "/admin", errors);
  await signInAs(page, "nova@demo.com");
  await expect(page).toHaveURL(/\/painel\/novo/);
  expect(errors).toEqual([]);
});

test("public pages of every brand", async ({ page }) => {
  const errors = watchErrors(page);
  const pages = [
    "/",
    "/beleza",
    "/barbearia",
    "/estetica",
    "/psicologia",
    "/fisioterapia",
    "/comecar",
    "/studio-bela?brand=beauty",
    "/studio-bela/agendar?brand=beauty",
    "/barbearia-navalha?brand=barber",
    "/clinica-pele?brand=aesthetics",
    "/espaco-escuta?brand=psychology",
    "/movimento-fisio?brand=physio",
    "/explorar?brand=beauty",
    "/explorar/sao-paulo/manicure?brand=beauty",
    "/entrar?brand=beauty",
    "/cadastro?brand=beauty",
    "/termos?brand=beauty",
    "/privacidade?brand=beauty",
  ];
  for (const path of pages) await visit(page, path, errors);
});
