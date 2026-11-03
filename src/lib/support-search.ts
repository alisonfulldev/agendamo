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
  "a o as os de da do das dos e em no na nos nas um uma uns umas para pra por com sem que como onde eu meu minha meus minhas seu sua quero queria fazer faz tem ter ser esta esse essa isso ai la ja mais muito nao sim qual quais quando posso consigo preciso coisa".split(
    " ",
  ),
);

/** Normalized words that carry meaning. */
function contentWords(text: string): string[] {
  return normalize(text)
    .split(" ")
    .filter((w) => w.length > 1 && !STOP.has(w));
}

/** At most one edit apart (typos like "agnda" or "horaio"). */
function nearlyEqual(a: string, b: string): boolean {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1 || Math.min(a.length, b.length) < 5) return false;
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

/** One typed word against one word of an item (exact, prefix of 4+ letters, or one typo). */
function wordMatches(typed: string, word: string): boolean {
  if (typed === word) return true;
  if (typed.length >= 4 && (word.startsWith(typed) || typed.startsWith(word))) return true;
  return nearlyEqual(typed, word);
}

function score(item: SupportItem, words: string[], phrase: string): number {
  // Small words left out on both sides: "mudar o nome" still is the phrase "mudar nome".
  const keywords = item.keywords.map((k) => contentWords(k).join(" "));
  const question = normalize(item.question);
  let total = 0;
  // A whole keyword phrase inside the question typed counts most ("mudar nome", "google agenda").
  let phraseHit = false;
  for (const keyword of keywords) {
    // Whole words only: "remarcar cliente" must not count as "marcar cliente".
    if (keyword.includes(" ") && ` ${phrase} `.includes(` ${keyword} `)) {
      total += 6;
      phraseHit = true;
    }
  }
  const keywordWords = keywords.flatMap((k) => k.split(" "));
  const questionWords = question.split(" ").filter((w) => !STOP.has(w));
  let matched = 0;
  for (const word of words) {
    if (keywordWords.some((k) => wordMatches(word, k))) {
      total += 3;
      matched++;
    } else if (questionWords.some((q) => wordMatches(word, q))) {
      total += 1;
      matched++;
    }
  }
  // One loose word in a long unrelated sentence ("previsão do tempo amanhã") is not a match.
  return phraseHit || matched * 2 >= words.length ? total : 0;
}

/** Best answers for a typed question, most relevant first (empty when nothing matches). */
export function searchSupport(items: SupportItem[], query: string, limit = 3): SupportItem[] {
  const words = contentWords(query);
  const phrase = words.join(" ");
  if (!words.length) return [];
  return items
    .map((item) => ({ item, score: score(item, words, phrase) }))
    .filter((r) => r.score >= 3)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.item);
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
