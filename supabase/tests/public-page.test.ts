import type { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";

import { as, createTestDb, SEED } from "./harness";

interface PublicPageJson {
  business: { name: string };
  page: { bio: string; has_pix: boolean };
  services: unknown[];
  professionals: unknown[];
}

let db: PGlite;

beforeAll(async () => {
  db = await createTestDb({ seed: true });
  await db.query(
    `insert into public.page_settings (business_id, bio, pix_key, pix_receiver_name) values ($1, 'Bem-vinda!', 'secret@pix.com', 'ANA')`,
    [SEED.psychology.business],
  );
  await db.query("update public.services set active = false where id = $1", [
    SEED.psychology.services[2],
  ]);
}, 60_000);

describe("get_public_page", () => {
  it("returns the page to anon without the Pix key", async () => {
    await as(db, { role: "anon" }, async (tx) => {
      const { rows } = await tx.query<{ page: PublicPageJson }>(
        "select public.get_public_page('studio-bela') as page",
      );
      const page = rows[0]!.page;
      expect(page.business.name).toBe("Studio Bela");
      expect(page.page.bio).toBe("Bem-vinda!");
      expect(page.page.has_pix).toBe(true);
      expect(JSON.stringify(page)).not.toContain("secret@pix.com");
      expect(page.services).toHaveLength(2); // inactive service hidden
      expect(page.professionals).toHaveLength(2);
    });
  });

  it("returns null for unknown slugs", async () => {
    const { rows } = await db.query<{ page: unknown }>(
      "select public.get_public_page('nao-existe') as page",
    );
    expect(rows[0]!.page).toBeNull();
  });
});
