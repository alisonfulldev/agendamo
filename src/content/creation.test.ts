import { describe, expect, it } from "vitest";

import { getBrand } from "@/brands";
import { CREATION, detectNiche, NICHE_KEYWORDS } from "@/content/creation";

describe("niche detection from the business name", () => {
  it.each([
    ["Barbearia do Zé", "barber"],
    ["Studio Brow Ana", "lash-brow"],
    ["Cílios da Bia", "lash-brow"],
    ["Esmalteria Flor", "nails"],
    ["Nails by Ju", "nails"],
    ["Psicóloga Carla Souza", "psychology"],
    ["Espaço Psicanálise", "psychoanalysis"],
    ["Clínica de Estética Pele", "aesthetics"],
    ["Salão Aurora", "beauty"],
    ["Hair Studio", "beauty"],
    ["Pet Feliz Banho e Tosa", "pet-grooming"],
    ["Arena Beach Tennis", "sports-court"],
    ["Lava Jato do Beto", "auto-detailing"],
    ["Fisio Movimento", "physio"],
  ])("%s -> %s", (name, key) => {
    expect(detectNiche(name)).toBe(key);
  });

  it.each(["Studio Carla", "Ateliê Restaura", "Espaço Luz", "Ana Paula"])(
    "%s: nothing detected (asks instead)",
    (name) => {
      expect(detectNiche(name)).toBeNull();
    },
  );

  it("every keyword and chip points to an existing niche", () => {
    for (const [key] of NICHE_KEYWORDS) expect(getBrand(key), key).toBeDefined();
    for (const key of CREATION.popular) expect(getBrand(key), key).toBeDefined();
  });
});
