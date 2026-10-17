/**
 * Support e-mail of the MeetChat site (support is by e-mail only). Configurable with
 * NEXT_PUBLIC_CONTACT_EMAIL; the default is the current address, on another domain
 * (brandcodesolutions.com.br) until a MeetChat address is decided.
 */
export const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL || "contato@brandcodesolutions.com.br";

/** mailto: link for reporting a public profile (removal channel), with the address prefilled. */
export function reportProfileHref(profileUrl: string): string {
  const subject = "Denúncia de perfil";
  const body = `Perfil: ${profileUrl}\n\nMotivo:`;
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
