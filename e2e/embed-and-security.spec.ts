import { expect, test } from "@playwright/test";

test("embed.js opens the booking chat in a modal; clicking outside closes it", async ({ page }) => {
  await page.goto("/embed-teste.html?brand=beauty");
  await page.waitForFunction(
    () => (window as unknown as { __livelyEmbed?: boolean }).__livelyEmbed === true,
  );
  await page.locator("#link-data").click();
  const dialog = page.getByRole("dialog", { name: "Agendamento" });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator("iframe")).toHaveAttribute("src", /\/studio-bela\/agendar\?embed=1$/);
  await dialog.click({ position: { x: 5, y: 5 } });
  await expect(dialog).toHaveCount(0);
});

test("only the chat page may be framed by other sites", async ({ request }) => {
  const home = await request.get("/?brand=beauty");
  expect(home.headers()["x-frame-options"]).toBe("DENY");
  expect(home.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");

  const chat = await request.get("/studio-bela/agendar?embed=1&brand=beauty");
  expect(chat.headers()["x-frame-options"]).toBeUndefined();
  expect(chat.headers()["content-security-policy"]).toContain("frame-ancestors *");
});
