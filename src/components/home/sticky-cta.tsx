"use client";

import { OpenCreationLink } from "@/components/creation/open-creation";
import { useEffect, useState } from "react";

/**
 * Phone only: the main call to action fixed at the bottom once the top of the page is gone.
 * It also hides while another call to action (the embedded chat, the closing button) is on screen,
 * so it never covers them.
 */
export function StickyCta({
  hideOn,
  label,
  niche,
}: {
  /** Ids of the elements that hide the bar while visible (the first one is the top button). */
  hideOn: string[];
  label: string;
  niche?: string;
}) {
  const [visible, setVisible] = useState(false);
  const ids = hideOn.join(" ");

  useEffect(() => {
    const targets = ids
      .split(" ")
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (targets.length === 0) return;
    const onScreen = new Set<Element>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) onScreen.add(entry.target);
        else onScreen.delete(entry.target);
      }
      setVisible(onScreen.size === 0);
    });
    for (const target of targets) observer.observe(target);
    return () => observer.disconnect();
  }, [ids]);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 p-3 backdrop-blur transition-[translate,visibility] duration-300 md:hidden ${
        visible ? "visible translate-y-0" : "invisible translate-y-full"
      }`}
      aria-hidden={!visible}
    >
      <OpenCreationLink
        niche={niche}
        tabIndex={visible ? 0 : -1}
        className="flex h-12 w-full items-center justify-center rounded-xl bg-primary text-base font-semibold text-primary-foreground"
      >
        {label}
      </OpenCreationLink>
    </div>
  );
}
