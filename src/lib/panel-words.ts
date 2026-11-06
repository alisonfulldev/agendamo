import type { BrandConfig } from "@/brands";

type WordsBrand = Pick<BrandConfig, "kind" | "terms">;

/**
 * Panel wording by niche (2026-11-05). The panel texts are written for "cliente" (feminine, as in
 * beauty); `adaptCustomer` rewrites them with the niche's word and article ("o paciente", "os
 * alunos", "do tutor"). Health niches never see sales wording: "Vender mais" is "Divulgação".
 */
export function panelWords(brand: WordsBrand) {
  const health = brand.kind === "health";
  const { singular, plural } = brand.terms.customer;
  return {
    health,
    customer: singular,
    customers: plural,
    Customer: capitalize(singular),
    Customers: capitalize(plural),
    /** Menu section of the growth tools. */
    sellSection: health ? "Divulgação" : "Vender mais",
    /** Screen /painel/vendas (title and menu item). */
    salesTitle: health ? "Ferramentas" : "Vendas",
    salesDescription: health
      ? `Ferramentas para manter a agenda organizada e trazer ${plural} de volta.`
      : `Ferramentas para encher a agenda e trazer ${plural} de volta.`,
    /** Plan feature name of the growth tools. */
    salesTools: health ? "Ferramentas de divulgação" : "Ferramentas de venda",
    /** Rewrites a panel text written for "cliente" (and "Vendas ›" paths, in health). */
    t: (text: string) => {
      const adapted = adaptCustomer(text, brand);
      return health ? adapted.replace(/Vendas (›|→)/g, "Ferramentas $1") : adapted;
    },
  };
}

export type PanelWords = ReturnType<typeof panelWords>;

/** Feminine words that follow "cliente" in the panel texts, with their masculine form. */
const AGREEMENT: Record<string, string> = {
  avisada: "avisado",
  avisadas: "avisados",
  bloqueada: "bloqueado",
  satisfeitas: "satisfeitos",
  indicada: "indicado",
  ela: "ele",
};

/**
 * "a cliente" → "o paciente", "das clientes" → "dos pacientes", "Cliente" → "Paciente"… The
 * panel's "cliente" is feminine; any other word is masculine (paciente, aluno, tutor, analisando).
 * Words that agree with it (avisada, bloqueada…) are switched in the same sentence only.
 */
export function adaptCustomer(text: string, brand: Pick<BrandConfig, "terms">): string {
  const { singular, plural } = brand.terms.customer;
  if (singular === "cliente") return text;
  // Sentences with their separators (line breaks are kept).
  return text
    .split(/((?<=[.!?])\s+)/)
    .map((sentence) => {
      if (!/clientes?/i.test(sentence)) return sentence;
      const replaced = sentence.replace(
        /(?<!\p{L})(?:(as|a|das|da|nas|na|às|à|pelas|pela|uma|essa|esta|sua|suas|nova|novas|outra|o|os|do|dos|no|nos|ao|aos|pelo|pelos|um|esse|este|seu|seus|novo|novos|outro)\s+)?(clientes?)(?!\p{L})/giu,
        (_match, article: string | undefined, word: string) => {
          const many = word.toLowerCase() === "clientes";
          const noun = matchCase(word, many ? plural : singular);
          if (!article) return noun;
          return `${matchCase(article, MASCULINE[article.toLowerCase()] ?? article)} ${noun}`;
        },
      );
      return replaced.replace(
        /(?<!\p{L})(avisadas?|bloqueada|satisfeitas|indicada|ela)(?!\p{L})/gu,
        (w) => AGREEMENT[w] ?? w,
      );
    })
    .join("");
}

const MASCULINE: Record<string, string> = {
  a: "o",
  as: "os",
  da: "do",
  das: "dos",
  na: "no",
  nas: "nos",
  à: "ao",
  às: "aos",
  pela: "pelo",
  pelas: "pelos",
  uma: "um",
  essa: "esse",
  esta: "este",
  sua: "seu",
  suas: "seus",
  nova: "novo",
  novas: "novos",
  outra: "outro",
};

function matchCase(model: string, word: string): string {
  const first = model.charAt(0);
  return first !== first.toLowerCase() ? capitalize(word) : word;
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
