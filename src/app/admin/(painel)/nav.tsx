"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/admin", label: "Visão geral" },
  { href: "/admin/negocios", label: "Negócios" },
  { href: "/admin/receita", label: "Receita" },
  { href: "/admin/uso", label: "Uso do produto" },
  { href: "/admin/cupons", label: "Cupons" },
];

/** Admin menu: a column on the computer, a scrollable row on the phone. */
export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Administração" className="overflow-x-auto">
      <ul className="flex gap-1 md:flex-col">
        {ITEMS.map((item) => {
          const active =
            item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`block rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
