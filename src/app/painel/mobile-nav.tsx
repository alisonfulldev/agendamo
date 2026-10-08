"use client";

import {
  CalendarDays,
  ChevronRight,
  Home,
  LogOut,
  type LucideIcon,
  Menu,
  Users,
  Wallet,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { signOutAction } from "@/app/(auth)/actions";

import { isActive, NAV_GROUP_LABELS, navTourId, visibleNav, type NavItem } from "./nav";

const TAB_ICONS: Record<string, LucideIcon> = {
  "/painel": Home,
  "/painel/agenda": CalendarDays,
  "/painel/clientes": Users,
  "/painel/financeiro": Wallet,
};

/**
 * Phone menu, like an app: the main pages as bottom tabs and the rest in "Mais", grouped.
 * Hidden on the computer, where the side menu shows everything.
 */
export function MobileNav({
  isOwner,
  customersLabel,
  locked = false,
}: {
  isOwner: boolean;
  customersLabel: string;
  locked?: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items = visibleNav(isOwner, locked);
  // Ended trial: the two remaining pages are the tabs themselves.
  const tabs = locked ? items : items.filter((item) => item.group === "main");
  const more = locked ? [] : items.filter((item) => item.group !== "main");
  const label = (item: NavItem) => (item.href === "/painel/clientes" ? customersLabel : item.label);
  const moreActive = more.some((item) => isActive(pathname, item.href));

  return (
    <div className="md:hidden">
      {open ? (
        <div className="fixed inset-0 z-40 flex flex-col justify-end">
          <button
            type="button"
            aria-label="Fechar menu"
            className="absolute inset-0 bg-foreground/50"
            onClick={() => setOpen(false)}
          />
          <nav
            aria-label="Mais opções do painel"
            className="relative max-h-[80dvh] overflow-y-auto rounded-t-3xl bg-background px-4 pt-3 pb-24 shadow-2xl motion-safe:animate-in motion-safe:slide-in-from-bottom"
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="text-lg font-semibold">Mais opções</p>
              <button
                type="button"
                aria-label="Fechar"
                className="flex size-10 items-center justify-center rounded-full hover:bg-muted"
                onClick={() => setOpen(false)}
              >
                <X className="size-5" />
              </button>
            </div>
            {(["business", "setup", "account"] as const).map((group) => {
              const list = more.filter((item) => item.group === group);
              if (!list.length) return null;
              return (
                <div key={group} className="mb-4">
                  <p className="mb-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    {NAV_GROUP_LABELS[group]}
                  </p>
                  <ul className="divide-y rounded-2xl border bg-card">
                    {list.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          data-tour={navTourId(item.href)}
                          aria-current={isActive(pathname, item.href) ? "page" : undefined}
                          onClick={() => setOpen(false)}
                          className="flex min-h-14 items-center gap-3 px-4 py-2.5"
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block font-medium">{label(item)}</span>
                            {item.hint ? (
                              <span className="block text-sm text-muted-foreground">
                                {item.hint}
                              </span>
                            ) : null}
                          </span>
                          <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
            <form action={signOutAction}>
              <button
                type="submit"
                className="flex min-h-14 w-full items-center gap-3 rounded-2xl border bg-card px-4 font-medium text-destructive"
              >
                <LogOut className="size-5" aria-hidden />
                Sair
              </button>
            </form>
          </nav>
        </div>
      ) : null}

      <nav
        aria-label="Painel"
        className="fixed inset-x-0 bottom-0 z-40 border-t bg-card pb-[env(safe-area-inset-bottom)]"
      >
        <ul className="flex">
          {tabs.map((item) => {
            const Icon = TAB_ICONS[item.href] ?? Menu;
            const active = isActive(pathname, item.href) && !open;
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  data-tour={navTourId(item.href)}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  className={`flex h-16 flex-col items-center justify-center gap-0.5 text-xs font-medium ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <Icon className="size-6" aria-hidden />
                  <span className="max-w-full truncate px-1">{label(item)}</span>
                </Link>
              </li>
            );
          })}
          {more.length ? (
            <li className="flex-1">
              <button
                type="button"
                data-tour="nav-more"
                aria-expanded={open}
                onClick={() => setOpen((value) => !value)}
                className={`flex h-16 w-full flex-col items-center justify-center gap-0.5 text-xs font-medium ${
                  open || moreActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Menu className="size-6" aria-hidden />
                Mais
              </button>
            </li>
          ) : null}
        </ul>
      </nav>
    </div>
  );
}
