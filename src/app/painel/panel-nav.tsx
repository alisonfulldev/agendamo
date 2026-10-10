"use client";

import { Lock } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { LockedModal } from "@/components/panel/locked-modal";
import type { LockedFeature } from "@/lib/plans";

import { isActive, navTourId, visibleNav } from "./nav";

/**
 * Side menu (computer). On the phone the bottom tabs take its place (MobileNav). On the Grátis
 * plan, paid items show a lock and open the subscription modal.
 */
export function PanelNav({
  isOwner,
  customersLabel,
  locked,
  trialAvailable,
}: {
  isOwner: boolean;
  /** Follows the brand terms (e.g. "Pacientes"). */
  customersLabel: string;
  locked: LockedFeature[];
  trialAvailable: boolean;
}) {
  const pathname = usePathname();
  const [modal, setModal] = useState<LockedFeature | null>(null);
  const base =
    "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors";
  return (
    <nav aria-label="Painel">
      {modal ? (
        <LockedModal
          feature={modal}
          trialAvailable={trialAvailable}
          onClose={() => setModal(null)}
        />
      ) : null}
      <ul className="flex flex-col gap-1">
        {visibleNav(isOwner).map((item) => {
          const active = isActive(pathname, item.href);
          const text = item.href === "/painel/clientes" ? customersLabel : item.label;
          if (item.feature && locked.includes(item.feature)) {
            return (
              <li key={item.href}>
                <button
                  type="button"
                  data-tour={navTourId(item.href)}
                  onClick={() => setModal(item.feature!)}
                  className={`${base} text-muted-foreground hover:bg-muted hover:text-foreground`}
                >
                  {text}
                  <Lock className="size-3.5" aria-label="Bloqueado" />
                </button>
              </li>
            );
          }
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
