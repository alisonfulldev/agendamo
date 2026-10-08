"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { isActive, navTourId, visibleNav } from "./nav";

/** Side menu (computer). On the phone the bottom tabs take its place (MobileNav). */
export function PanelNav({
  isOwner,
  customersLabel,
  locked = false,
}: {
  isOwner: boolean;
  /** Follows the brand terms (e.g. "Pacientes"). */
  customersLabel: string;
  /** Trial ended without a subscription: only the plan and the account. */
  locked?: boolean;
}) {
  const pathname = usePathname();
  return (
    <nav aria-label="Painel">
      <ul className="flex flex-col gap-1">
        {visibleNav(isOwner, locked).map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                data-tour={navTourId(item.href)}
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
