/** Small RFC 4180 CSV reader/writer. Detects "," or ";" (Excel in pt-BR uses ";") and strips the BOM. */

export function parseCsv(text: string): string[][] {
  const input = text.replace(/^﻿/, "");
  const firstLine = input.split(/\r?\n/, 1)[0] ?? "";
  const delimiter =
    (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < input.length; i++) {
    const char = input[i]!;
    if (quoted) {
      if (char === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += char;
    } else if (char === '"' && field === "") {
      quoted = true;
    } else if (char === delimiter) {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && input[i + 1] === "\n") i++;
      row.push(field);
      if (row.some((cell) => cell.trim() !== "")) rows.push(row);
      row = [];
      field = "";
    } else field += char;
  }
  row.push(field);
  if (row.some((cell) => cell.trim() !== "")) rows.push(row);
  return rows;
}

function escapeCell(value: string): string {
  // Prevent spreadsheet formula injection, then quote when needed.
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[";,\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/** CSV with ";" (opens correctly in Excel pt-BR) and a BOM for accents. */
export function toCsv(rows: (string | number | null | undefined)[][]): string {
  return `﻿${rows.map((row) => row.map((cell) => escapeCell(cell == null ? "" : String(cell))).join(";")).join("\r\n")}\r\n`;
}

const HEADER_ALIASES: Record<"name" | "phone" | "email" | "birthdate", string[]> = {
  name: ["nome", "name", "cliente", "nome completo"],
  phone: ["telefone", "celular", "whatsapp", "phone", "fone", "tel"],
  email: ["email", "e-mail", "mail"],
  birthdate: [
    "aniversario",
    "aniversário",
    "nascimento",
    "data de nascimento",
    "birthdate",
    "birthday",
  ],
};

const normalize = (value: string) =>
  value.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();

/** Maps header cells to known columns. Returns null when there is no name or phone column. */
export function mapCustomerHeaders(
  header: string[],
): Partial<Record<keyof typeof HEADER_ALIASES, number>> | null {
  const map: Partial<Record<keyof typeof HEADER_ALIASES, number>> = {};
  header.forEach((cell, index) => {
    const key = normalize(cell);
    for (const [column, aliases] of Object.entries(HEADER_ALIASES) as [
      keyof typeof HEADER_ALIASES,
      string[],
    ][]) {
      if (map[column] === undefined && aliases.map(normalize).includes(key)) map[column] = index;
    }
  });
  return map.name !== undefined && map.phone !== undefined ? map : null;
}

/** "31/12/1990", "1990-12-31" -> "1990-12-31"; null when not a valid date. */
export function parseBirthdate(value: string | undefined): string | null {
  if (!value?.trim()) return null;
  const v = value.trim();
  let y: number, m: number, d: number;
  const br = v.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  const iso = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (br) [d, m, y] = [Number(br[1]), Number(br[2]), Number(br[3])];
  else if (iso) [y, m, d] = [Number(iso[1]), Number(iso[2]), Number(iso[3])];
  else return null;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (
    date.getUTCFullYear() !== y ||
    date.getUTCMonth() !== m - 1 ||
    date.getUTCDate() !== d ||
    y < 1900
  )
    return null;
  return date.toISOString().slice(0, 10);
}
