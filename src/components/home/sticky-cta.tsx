"use client";

import { OpenCreationLink } from "@/components/creation/open-creation";
import { useEffect, useState } from "react";

/** Phone only: the main call to action fixed at the bottom once the top of the page is gone. */
export function StickyCta({
  targetId,
  label,
  niche,
}: {
  targetId: string;
  label: string;
  niche?: string;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(!entry!.isIntersecting));
    observer.observe(target);
    return () => observer.disconnect();
  }, [targetId]);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 p-3 backdrop-blur transition-transform duration-300 md:hidden ${
        visible ? "translate-y-0" : "translate-y-full"
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
