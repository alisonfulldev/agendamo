"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { isActive, navTourId, sectionOf, visibleSections, type NavOptions } from "./nav";

/**
 * Side menu (computer): one line per section (7 at most); the screens of a section are tabs at the
 * top of the page (SectionTabs). On the phone the bottom tabs take its place (MobileNav).
 */
export function PanelNav({
  customersLabel,
  ...options
}: NavOptions & {
  /** Follows the brand terms (e.g. "Pacientes"). */
  customersLabel: string;
}) {
  const pathname = usePathname();
  const sections = visibleSections(options);
  const current = sectionOf(sections, pathname);
  const base =
    "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors";
  return (
    <nav aria-label="Painel">
      <ul className="flex flex-col gap-1">
        {sections.map((section) => {
          const first = section.items[0]!;
          const active = current?.key === section.key;
          return (
            <li key={section.key}>
              <Link
                href={first.href}
                data-tour={navTourId(first.href)}
                aria-current={active ? "page" : undefined}
                className={`${base} ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {section.key === "customers" ? customersLabel : section.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Screens of the current section as tabs (only when the section has more than one). */
export function SectionTabs(options: NavOptions) {
  const pathname = usePathname();
  const section = sectionOf(visibleSections(options), pathname);
  if (!section || section.items.length < 2) return null;
  return (
    <nav aria-label={section.label} className="-mx-4 mb-4 overflow-x-auto px-4 md:mx-0 md:px-0">
      <ul className="flex gap-1 border-b">
        {section.items.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`-mb-px flex min-h-11 items-center border-b-2 px-3 text-sm font-medium whitespace-nowrap ${
                  active
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
