/**
 * Instagram bio generator (/ferramentas/bio-instagram): short bios that end with a call to book
 * through the link. Instagram bios have up to 150 characters; longer options are left out.
 */
export const BIO_LIMIT = 150;

export interface BioInput {
  /** Area as people say it ("Manicure e nail designer"). */
  area: string;
  /** What stands out ("Alongamento em gel", "Atendimento online"). */
  highlight: string;
  /** City or neighborhood (optional). */
  place: string;
}

export function buildBios(input: BioInput): string[] {
  const area = input.area.trim() || "Atendimento com hora marcada";
  const highlight = input.highlight.trim();
  const place = input.place.trim();
  const where = place ? `📍 ${place}` : "";
  const options = [
    [area, highlight && `✨ ${highlight}`, where, "📅 Agende pelo link 👇"],
    [`${area}${place ? ` em ${place}` : ""}`, highlight, "Horários livres no link abaixo 👇"],
    [highlight ? `${highlight} | ${area}` : area, where, "Agende sem precisar chamar no direct 👇"],
    [area, highlight && `Especialidade: ${highlight}`, "🗓️ Marque seu horário no link"],
  ];
  const bios = options.map((lines) => lines.filter(Boolean).join("\n"));
  return [...new Set(bios)].filter((bio) => [...bio].length <= BIO_LIMIT);
}
