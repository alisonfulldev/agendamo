import { describe, expect, it } from "vitest";

import { getNiche } from "@/brands";

import { adaptCustomer, panelWords } from "./panel-words";

const psychology = getNiche("psychology");
const beauty = getNiche("beauty");
const pilates = getNiche("pilates");

describe("panelWords", () => {
  it("marks health niches and avoids sales wording", () => {
    expect(psychology.kind).toBe("health");
    expect(beauty.kind).toBe("general");
    expect(panelWords(psychology).sellSection).toBe("Divulgação");
    expect(panelWords(psychology).salesTitle).not.toMatch(/vend/i);
    expect(panelWords(beauty).sellSection).toBe("Vender mais");
  });
});

describe("adaptCustomer", () => {
  it("keeps the texts of niches that say cliente", () => {
    expect(adaptCustomer("A cliente foi avisada.", beauty)).toBe("A cliente foi avisada.");
  });

  it("switches word, article and agreement", () => {
    expect(adaptCustomer("Agendamento aprovado. A cliente foi avisada.", psychology)).toBe(
      "Agendamento aprovado. O paciente foi avisado.",
    );
    expect(adaptCustomer("Nome da cliente", psychology)).toBe("Nome do paciente");
    expect(adaptCustomer("Essa cliente está bloqueada.", psychology)).toBe(
      "Esse paciente está bloqueado.",
    );
    expect(adaptCustomer("Seus clientes e as clientes antigas", pilates)).toBe(
      "Seus alunos e os alunos antigas",
    );
    expect(adaptCustomer("Combine à cliente. Cliente", psychology)).toBe(
      "Combine ao paciente. Paciente",
    );
  });

  it("leaves agreement of other sentences alone", () => {
    expect(adaptCustomer("Ela chegou. Busque a cliente.", psychology)).toBe(
      "Ela chegou. Busque o paciente.",
    );
  });
});
