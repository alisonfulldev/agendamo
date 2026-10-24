import { readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { NICHES } from "@/brands";

import { isSitePath, SITE_SECTIONS, UNTRACKED_SECTIONS } from "./site-paths";

const NICHE_ROUTES = NICHES.map((brand) => brand.niche!.route);

describe("Google tag: sales site only", () => {
  it("runs on the home, niche pages, prices, guides, sign-up and sign-in", () => {
    for (const path of ["/", "/barbearia", "/barbearia/sao-paulo", "/precos", "/ajuda/x"]) {
      expect(isSitePath(path, NICHE_ROUTES), path).toBe(true);
    }
    expect(isSitePath("/cadastro", NICHE_ROUTES)).toBe(true);
    expect(isSitePath("/entrar", NICHE_ROUTES)).toBe(true);
  });

  it("never on a business link, the panel, the admin or e-mail pages", () => {
    for (const path of [
      "/fulano-de-tal",
      "/fulano-de-tal/perfil",
      "/fulano-de-tal/agendar",
      "/painel",
      "/painel/agenda",
      "/admin",
      "/cancelar/abc",
      "/avaliar/abc",
      "/descadastrar/abc",
    ]) {
      expect(isSitePath(path, NICHE_ROUTES), path).toBe(false);
    }
  });

  it("every top-level route is classified (a new one must be added to a list)", () => {
    const app = join(process.cwd(), "src", "app");
    const known = new Set<string>([...SITE_SECTIONS, ...UNTRACKED_SECTIONS, ...NICHE_ROUTES]);
    const folders = readdirSync(app, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith("["))
      .flatMap((entry) =>
        entry.name.startsWith("(")
          ? readdirSync(join(app, entry.name), { withFileTypes: true })
              .filter((child) => child.isDirectory())
              .map((child) => child.name)
          : [entry.name],
      )
      // Route handlers for files (robots.txt, sitemap.xml, embed.js…) are not pages.
      .filter((name) => !name.includes("."));
    expect(folders.filter((name) => !known.has(name))).toEqual([]);
  });
});
