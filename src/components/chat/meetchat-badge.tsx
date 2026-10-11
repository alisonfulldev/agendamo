/**
 * "Agende também com o MeetChat": shown only in waiting mode, in the chat (and on external sites)
 * and on the profile. Links to the MeetChat site, where anyone can create their own chat.
 */
export function MeetChatBadge({ href, logo }: { href: string; logo: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      className="mx-auto inline-flex items-center gap-2 rounded-full border bg-card px-3.5 py-1.5 text-sm font-medium text-card-foreground shadow-sm transition-colors hover:border-primary"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- small static SVG logo */}
      <img src={logo} alt="" width={20} height={20} className="rounded-md" />
      <span>
        Agende também com o <span className="font-bold">MeetChat</span>
      </span>
    </a>
  );
}
