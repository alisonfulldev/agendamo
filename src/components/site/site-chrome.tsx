import Link from "next/link";

import { NICHES, PLATFORM } from "@/brands";
import { HOME } from "@/content/home";

/** Top bar of the MeetChat site: logo (home) and "Entrar". Niche pages show their logo and name. */
export function SiteHeader({ badge, logo = PLATFORM.logo }: { badge?: string; logo?: string }) {
  return (
    <header className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
      <Link href="/" className="flex items-center gap-2 font-heading text-lg font-semibold">
        {/* eslint-disable-next-line @next/next/no-img-element -- small static SVG logo */}
        <img src={logo} alt="" width={30} height={30} />
        MeetChat
        {badge ? (
          <span className="rounded-full border bg-card px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            {badge}
          </span>
        ) : null}
      </Link>
      <Link
        href="/entrar"
        className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        Entrar
      </Link>
    </header>
  );
}

/** Niche links ("Agendamento online por área") and the footer links of the MeetChat site. */
export function SiteFooter({ links = HOME.footer.links }: { links?: typeof HOME.footer.links }) {
  return (
    <>
      <nav aria-labelledby="areas" className="mx-auto w-full max-w-6xl px-5 pb-10">
        <h2 id="areas" className="text-sm font-semibold text-muted-foreground">
          Agendamento online por área
        </h2>
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm">
          {NICHES.map((b) => (
            <li key={b.key}>
              <Link
                href={`/${b.niche!.route}`}
                className="text-muted-foreground hover:text-foreground"
              >
                {b.niche!.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <footer className="border-t pb-24 md:pb-0">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-muted-foreground sm:flex-row">
          <p>© 2026 MeetChat</p>
          <nav aria-label="Rodapé" className="flex flex-wrap justify-center gap-5">
            {links.map((link) => (
              <Link key={link.label} href={link.href} className="hover:text-foreground">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </>
  );
}
