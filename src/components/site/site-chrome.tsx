import Link from "next/link";

import { getBrand, PLATFORM } from "@/brands";
import { CONTACT_EMAIL } from "@/content/contact";
import { INTENT_PAGES } from "@/content/intent-pages";
import { TOOLS } from "@/content/tools";

/** Top bar of the MeetChat site: logo, a short menu and "Entrar". Niche pages show their logo and name. */
export function SiteHeader({ badge, logo = PLATFORM.logo }: { badge?: string; logo?: string }) {
  const base =
    "min-h-11 items-center rounded-xl px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground";
  const item = `inline-flex ${base}`;
  const wide = `hidden md:inline-flex ${base}`;
  return (
    <header className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-2 px-5 sm:px-8">
      <Link
        href="/"
        className="flex min-h-11 items-center gap-2 font-heading text-lg font-semibold"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- small static SVG logo */}
        <img src={logo} alt="" width={30} height={30} />
        MeetChat
        {badge ? (
          <span className="hidden rounded-full border bg-card px-2.5 py-0.5 text-xs font-medium text-muted-foreground sm:inline">
            {badge}
          </span>
        ) : null}
      </Link>
      <nav aria-label="Principal" className="flex items-center">
        <Link href="/#profissoes" className={wide}>
          Para quem
        </Link>
        <Link href="/agendamento" className={wide}>
          Guias
        </Link>
        <Link href="/precos" className={item}>
          Preços
        </Link>
        <Link href="/entrar" className={`${item} text-foreground`}>
          Entrar
        </Link>
      </nav>
    </header>
  );
}

/** Most searched areas in the footer (the full list is on the home, "Para quem"). */
const FOOTER_NICHES = [
  "beauty",
  "barber",
  "nails",
  "lash-brow",
  "aesthetics",
  "psychology",
  "physio",
  "nutrition",
];

const FOOTER_INTENTS = [
  "pelo-whatsapp",
  "reduzir-faltas",
  "link-na-bio",
  "lembrete-automatico",
  "agenda-gratis",
  "multiagenda",
];

/** Footer organized by what the visitor came for: area, problem, tools and the product. */
export function SiteFooter() {
  const niches = FOOTER_NICHES.map((key) => getBrand(key)).filter((b) => b?.niche);
  const intents = FOOTER_INTENTS.map((slug) => INTENT_PAGES.find((p) => p.slug === slug)).filter(
    (p) => p !== undefined,
  );
  const columns: { title: string; links: { label: string; href: string }[] }[] = [
    {
      title: "Para a sua área",
      links: [
        ...niches.map((b) => ({ label: b!.niche!.name, href: `/${b!.niche!.route}` })),
        { label: "Todas as áreas", href: "/#profissoes" },
      ],
    },
    {
      title: "Resolva",
      links: intents.map((p) => ({ label: p.label, href: `/agendamento/${p.slug}` })),
    },
    {
      title: "Ferramentas grátis",
      links: [
        ...TOOLS.map((t) => ({ label: t.label, href: `/ferramentas/${t.slug}` })),
        { label: "Comparativos", href: "/comparar" },
        { label: "Recursos", href: "/recursos" },
      ],
    },
    {
      title: "MeetChat",
      links: [
        { label: "Preços", href: "/precos" },
        { label: "Central de ajuda", href: "/ajuda" },
        { label: "Contato", href: `mailto:${CONTACT_EMAIL}` },
        { label: "Termos de uso", href: "/termos" },
        { label: "Privacidade", href: "/privacidade" },
        { label: "Entrar", href: "/entrar" },
      ],
    },
  ];

  return (
    <footer className="border-t pb-24 md:pb-0">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-12 sm:grid-cols-2 sm:px-8 lg:grid-cols-4">
        {columns.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <h2 className="text-sm font-semibold">{column.title}</h2>
            <ul className="mt-3 flex flex-col gap-1">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex min-h-9 items-center text-sm text-muted-foreground hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="mx-auto w-full max-w-6xl border-t px-5 py-6 text-sm text-muted-foreground sm:px-8">
        © 2026 MeetChat
      </div>
    </footer>
  );
}
