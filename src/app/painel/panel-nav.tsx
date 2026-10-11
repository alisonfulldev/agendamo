"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { isActive, navTourId, visibleNav, type NavOptions } from "./nav";

/**
 * Side menu (computer). On the phone the bottom tabs take its place (MobileNav). In waiting mode
 * only the subscription and the account are listed.
 */
export function PanelNav({
  customersLabel,
  ...options
}: NavOptions & {
  /** Follows the brand terms (e.g. "Pacientes"). */
  customersLabel: string;
}) {
  const pathname = usePathname();
  const base =
    "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors";
  return (
    <nav aria-label="Painel">
      <ul className="flex flex-col gap-1">
        {visibleNav(options).map((item) => {
          const active = isActive(pathname, item.href);
          const text = item.href === "/painel/clientes" ? customersLabel : item.label;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                data-tour={navTourId(item.href)}
                aria-current={active ? "page" : undefined}
                className={`${base} ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {text}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
