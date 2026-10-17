/**
 * "Agende também com o MeetChat": shown only in waiting mode, in the chat (and on external sites)
 * and on the profile. Links to the niche's page on the MeetChat site; the second line names the
 * niche, so the link text varies by niche.
 */
export function MeetChatBadge({
  href,
  logo,
  niche,
}: {
  href: string;
  logo: string;
  /** Niche name ("Barbearia"); absent for "Outro / Geral". */
  niche?: string;
}) {
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
