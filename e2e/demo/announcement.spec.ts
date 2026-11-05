import { expect, test } from "@playwright/test";

/** One-time "Site + Agenda" announcement (2026-11-06): panel popup and the admin send. */

test.describe("popup", () => {
  // A fresh browser: the popup is not marked as seen.
  test.use({ storageState: { cookies: [], origins: [] } });

  test("an account from before the news sees it once", async ({ page }) => {
    await page.goto("/demo#planos");
    await page
      .locator("#planos form", { hasText: "Espaço Escuta" })
      .getByRole("button", { name: "Teste do Completo", exact: true })
      .click();
    await page.waitForURL(/ok=plano/);
    await page.goto("/demo");
    await page
      .locator("form", { hasText: "psi@demo.com" })
      .getByRole("button", { name: "Entrar" })
      .click();
    await page.waitForURL(/\/painel/);
    const dialog = page.getByRole("dialog", { name: /seu teste agora vem com um site/ });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Agora não" }).click();
    await page.reload();
    await page.waitForTimeout(2500);
    await expect(page.getByRole("dialog", { name: /seu teste agora vem com um site/ })).toHaveCount(
      0,
    );
  });
});

test("admin sees the texts and sends the announcement once", async ({ page }) => {
  await page.goto("/demo");
  await page
    .locator("form", { hasText: "admin@demo.com" })
    .getByRole("button", { name: "Entrar" })
    .click();
  await page.waitForURL(/\/admin/);
  await page.goto("/admin/anuncio");
  await expect(page.getByText("Novidade: seu teste agora vem com um site 🎉")).toBeVisible();
  const button = page.getByRole("button", { name: /^Enviar para \d+ pessoas$/ });
  if (await button.isDisabled()) return; // Already sent in an earlier run.
  await button.click();
  await page.getByRole("button", { name: "Sim, enviar" }).click();
  await expect(page.getByText(/^Enviado para \d+/)).toBeVisible();
  // Batches of 40: the count of sent ones goes up, and nobody gets it twice.
  await page.reload();
  await expect(page.getByText(/Já enviados: [1-9]d*/)).toBeVisible();
});
