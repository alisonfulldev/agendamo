/**
 * The MeetChat badge, on every business link (2026-10-27): in the chat (and on external sites) and
 * on the profile. Links to the niche's page on the MeetChat site.
 * - Waiting mode: the full card "Agende também com o MeetChat", with the niche on a second line.
 * - Trial and paid plan (`discreet`): one small muted line, "Agenda online por MeetChat", that
 *   stays out of the business's way but still lets its clients find MeetChat.
 */
export function MeetChatBadge({
  href,
  logo,
  niche,
  discreet = false,
}: {
  href: string;
  logo: string;
  /** Niche name ("Barbearia"); absent for "Outro / Geral". */
  niche?: string;
  discreet?: boolean;
}) {
  if (discreet) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener"
        className="mx-auto inline-flex items-center gap-1.5 px-2 py-1 text-xs text-muted-foreground opacity-80 transition-opacity hover:opacity-100"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- small static SVG logo */}
        <img src={logo} alt="" width={14} height={14} className="rounded-sm" />
        <span>
          Agenda online por <span className="font-semibold">MeetChat</span>
        </span>
      </a>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      className="mx-auto inline-flex items-center gap-2 rounded-full border bg-card px-3.5 py-1.5 text-sm font-medium text-card-foreground shadow-sm transition-colors hover:border-primary"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- small static SVG logo */}
      <img src={logo} alt="" width={20} height={20} className="rounded-md" />
      <span className="flex flex-col leading-tight">
        <span>
          Agende também com o <span className="font-bold">MeetChat</span>
        </span>
        {niche ? (
          <span className="text-xs font-normal text-muted-foreground">
            Agenda online para {niche.toLowerCase()}
          </span>
        ) : null}
      </span>
    </a>
  );
}
