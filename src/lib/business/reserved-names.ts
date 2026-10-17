/**
 * Business names that would pass for the platform itself (moderation, D2 2026-10-16): any name
 * with "MeetChat" in it, written with spaces, hyphens, dots or accents in between. Pure, so the
 * creation chat can warn right away; the server always checks again.
 */
const RESERVED = /m[e3]{2}t[\s._-]*ch[a4]t/i;

export const RESERVED_NAME_MESSAGE = "Esse nome é reservado. Use o nome do seu negócio.";

export function isReservedBusinessName(name: string): boolean {
  const plain = name.normalize("NFD").replace(/\p{Diacritic}/gu, "");
  return RESERVED.test(plain);
}
