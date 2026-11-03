import type { SupportItem } from "@/content/support";

/** Lowercase, no accents or punctuation: "Não consigo mudar o NOME!" → "nao consigo mudar o nome". */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Words that say nothing about the subject. */
const STOP = new Set(
  "a o as os de da do das dos e em no na nos nas num numa um uma uns umas para pra pro por pelo pela com sem que como onde eu meu minha meus minhas seu sua seus suas me mim voce vc quero queria gostaria fazer faco faz fiz tem ter tenho ser sou esta estou esse essa isso este esta ai la ja mais muito nao sim qual quais quando posso pode consigo consegue preciso precisa coisa algum alguma aqui agora so tambem favor ajuda ajudar duvida sobre ta quanto quanta quantos quantas vejo veja vi".split(
    " ",
  ),
);

/**
 * Words with the same meaning, reduced to one: what the owner types and the answers' keywords
 * meet here ("trocar a foto" = "mudar foto", "paciente" = "cliente").
 */
const SYNONYMS: string[][] = [
  [
    "mudar",
    "trocar",
    "alterar",
    "editar",
    "corrigir",
    "modificar",
    "atualizar",
    "ajustar",
    "arrumar",
    "consertar",
  ],
  [
    "colocar",
    "adicionar",
    "incluir",
    "cadastrar",
    "criar",
    "inserir",
    "por",
    "botar",
    "acrescentar",
    "subir",
    "novo",
    "nova",
  ],
  ["tirar", "remover", "apagar", "excluir", "deletar", "retirar", "eliminar"],
  [
    "ver",
    "achar",
    "encontrar",
    "acessar",
    "mostrar",
    "aparecer",
    "aparece",
    "visualizar",
    "olhar",
    "fica",
    "esta",
  ],
  ["cliente", "paciente", "aluno", "aluna", "tutor", "freguesa", "freguesia"],
  ["horario", "hora", "horas"],
  ["agendamento", "atendimento", "consulta", "sessao", "reserva", "marcacao", "compromisso"],
  ["foto", "imagem", "fotografia", "logo", "logotipo", "avatar"],
  ["servico", "procedimento", "tratamento"],
  [
    "profissional",
    "funcionario",
    "colaborador",
    "atendente",
    "barbeiro",
    "manicure",
    "cabeleireira",
    "terapeuta",
  ],
  ["cancelar", "desmarcar"],
  ["pagar", "pagamento", "cobranca", "cobrar"],
  ["dinheiro", "ganhei", "ganho", "faturei", "faturamento", "lucro", "receita", "caixa"],
  ["celular", "telefone", "smartphone"],
  ["aviso", "notificacao", "alerta"],
  ["senha", "password"],
  ["sair", "deslogar", "logout"],
];
const CANONICAL = new Map<string, string>();
for (const group of SYNONYMS) for (const word of group) CANONICAL.set(stem(word), stem(group[0]!));

/** Verbs that say what to do, not about what: they count, but little. */
const ACTIONS = new Set(["mudar", "colocar", "tirar", "ver"].map(stem));

/** Light Portuguese stemmer: "mudei", "mudando", "mudo" → "mud"; "servicos" → "servic". */
export function stem(word: string): string {
  if (word.length <= 3) return word;
  const endings = [
    "amento",
    "imento",
    "mente",
    "acoes",
    "icoes",
    "ando",
    "endo",
    "indo",
    "aram",
    "eram",
    "iram",
    "amos",
    "emos",
    "imos",
    "ados",
    "adas",
    "idos",
    "idas",
    "acao",
    "icao",
    "oes",
    "ões",
    "ado",
    "ada",
    "ido",
    "ida",
    "ava",
    "ar",
    "er",
    "ir",
    "ei",
    "ou",
    "eu",
    "iu",
    "es",
    "as",
    "os",
    "o",
    "a",
    "e",
    "s",
  ];
  for (const end of endings) {
    if (word.endsWith(end) && word.length - end.length >= 3) return word.slice(0, -end.length);
  }
  return word;
}

/** Meaningful words of a text, stemmed and with synonyms unified. */
export function terms(text: string): string[] {
  return normalize(text)
    .split(" ")
    .filter((w) => w.length > 1 && !STOP.has(w))
    .map((w) => {
      const s = stem(w);
      const exact = CANONICAL.get(s);
      if (exact) return exact;
      // A typo still reaches its synonym group ("atendimeto" → "atendimento").
      for (const [key, canonical] of CANONICAL)
        if (key.length >= 4 && same(s, key)) return canonical;
      return s;
    });
}

/** At most one edit apart (typos like "agnda" or "horaio"). */
function nearlyEqual(a: string, b: string): boolean {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1 || Math.min(a.length, b.length) < 4) return false;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++;
      j++;
      continue;
    }
    if (++edits > 1) return false;
    if (a.length > b.length) i++;
    else if (b.length > a.length) j++;
    else {
      i++;
      j++;
    }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

/** Equal, one typo apart, or one is the start of the other (5+ letters: "atendimet" ~ "atend"). */
function same(a: string, b: string): boolean {
  if (a === b || nearlyEqual(a, b)) return true;
  return Math.min(a.length, b.length) >= 5 && (a.startsWith(b) || b.startsWith(a));
}

interface Indexed {
  item: SupportItem;
  /** Keyword phrases as term lists ("mudar nome" → ["mud", "nom"]). */
  phrases: string[][];
  keywordTerms: Set<string>;
  questionTerms: Set<string>;
}

const cache = new WeakMap<SupportItem, Indexed>();
function index(item: SupportItem): Indexed {
  let entry = cache.get(item);
  if (!entry) {
    const phrases = item.keywords.map(terms).filter((t) => t.length);
    // Synonyms make some phrases equal ("mudar horario" = "trocar horario"): count each once.
    const unique = [
      ...new Map(
        phrases.filter((t) => t.length > 1).map((t) => [[...t].sort().join(" "), t]),
      ).values(),
    ];
    entry = {
      item,
      phrases: unique,
      keywordTerms: new Set(phrases.flat()),
      questionTerms: new Set(terms(item.question)),
    };
    cache.set(item, entry);
  }
  return entry;
}

function score(entry: Indexed, typed: string[]): number {
  let total = 0;
  // A keyword phrase whose words all appear in what was typed counts most ("mudar nome").
  for (const phrase of entry.phrases) {
    if (phrase.every((p) => typed.some((t) => same(t, p)))) total += 4 + phrase.length;
  }
  const subject = typed.filter((t) => !ACTIONS.has(t));
  let subjectMatched = 0;
  for (const t of typed) {
    const weight = ACTIONS.has(t) ? 1 : 3;
    if ([...entry.keywordTerms].some((k) => same(t, k))) {
      total += weight;
      if (weight === 3) subjectMatched++;
    } else if ([...entry.questionTerms].some((q) => same(t, q))) {
      total += weight === 3 ? 2 : 0.5;
      if (weight === 3) subjectMatched++;
    }
  }
  // About what? At least half of the subject words must match (one loose word in a long
  // unrelated sentence is not enough); a question with only an action ("mudar") never matches.
  if (!subject.length || subjectMatched * 2 < subject.length) return 0;
  return total;
}

export type SupportResult =
  | { kind: "answer"; item: SupportItem; others: SupportItem[] }
  | { kind: "choose"; items: SupportItem[] }
  | { kind: "vague" }
  | { kind: "greeting" }
  | { kind: "thanks" }
  | { kind: "none" };

const GREETINGS = /^(oi+|ola|opa|bom dia|boa tarde|boa noite|e ai|hey|hello)\b/;
const THANKS = /^(obrigad[oa]|valeu|vlw|brigad[oa]|show|perfeito|otimo|ok|blz|beleza)\b/;

/**
 * Understands what was typed: one clear answer, a choice when two are close, a nudge when it is
 * too vague, or nothing.
 */
export function understand(items: SupportItem[], query: string): SupportResult {
  const plain = normalize(query);
  if (!plain) return { kind: "none" };
  // "oi, como mudo o nome?" → the greeting is dropped and the rest is the question.
  const greeted = GREETINGS.test(plain);
  const thanked = THANKS.test(plain);
  const rest = plain.replace(GREETINGS, "").replace(THANKS, "").trim();
  const typed = terms(rest);
  if (!typed.length) {
    if (greeted) return { kind: "greeting" };
    if (thanked) return { kind: "thanks" };
    return { kind: "vague" };
  }
  if (typed.every((t) => ACTIONS.has(t))) return { kind: "vague" };
  const ranked = items
    .map((item) => ({ item, score: score(index(item), typed) }))
    .filter((r) => r.score >= 3)
    .sort((a, b) => b.score - a.score);
  if (!ranked.length) return { kind: "none" };
  const [best, second] = ranked;
  // Too close to tell: ask instead of guessing.
  if (second && second.score >= best!.score * 0.85) {
    return { kind: "choose", items: ranked.slice(0, 3).map((r) => r.item) };
  }
  return { kind: "answer", item: best!.item, others: ranked.slice(1, 3).map((r) => r.item) };
}

/** Best answers for a typed question, most relevant first (empty when nothing matches). */
export function searchSupport(items: SupportItem[], query: string, limit = 3): SupportItem[] {
  const result = understand(items, query);
  if (result.kind === "answer") return [result.item, ...result.others].slice(0, limit);
  if (result.kind === "choose") return result.items.slice(0, limit);
  return [];
}

/** Suggestions for the screen the person is on (falls back to the most common ones). */
export function suggestionsFor(items: SupportItem[], pathname: string, limit = 4): SupportItem[] {
  const here = items.filter((item) =>
    item.suggestOn?.some((p) =>
      p === "/painel" ? pathname === "/painel" : pathname === p || pathname.startsWith(`${p}/`),
    ),
  );
  const common = items.filter((item) => item.suggestOn?.includes("/painel"));
  return [...new Set([...here, ...common])].slice(0, limit);
}

/** Items this person may see: staff only see the ones marked for staff. */
export function visibleSupport(items: SupportItem[], isOwner: boolean): SupportItem[] {
  return isOwner ? items : items.filter((item) => item.staff);
}
