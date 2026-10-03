"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { isActive, PANEL_NAV } from "./nav";

/** customersLabel follows the brand terms (e.g. "Pacientes"). */
export function PanelNav({
  isOwner,
  customersLabel,
  locked = false,
}: {
  isOwner: boolean;
  customersLabel: string;
  /** Trial ended without a subscription: only the plan and the account. */
  locked?: boolean;
}) {
  const pathname = usePathname();
  const items = PANEL_NAV.filter((item) => isOwner || item.staff).filter(
    (item) => !locked || item.href === "/painel/plano" || item.href === "/painel/conta",
  );
  return (
    <nav
      aria-label="Painel"
      className="-mx-4 overflow-x-auto px-4 md:mx-0 md:overflow-visible md:px-0"
    >
      <ul className="flex gap-1 md:flex-col">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {item.href === "/painel/clientes" ? customersLabel : item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
