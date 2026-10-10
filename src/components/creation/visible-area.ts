"use client";

import { useEffect, useState } from "react";

/** Height and top of the visible area (above the on-screen keyboard), on phones. */
export function useVisibleArea(): { height: number; top: number } | null {
  const [area, setArea] = useState<{ height: number; top: number } | null>(null);
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const update = () =>
      setArea(
        window.innerWidth < 768 ? { height: viewport.height, top: viewport.offsetTop } : null,
      );
    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, []);
  return area;
}
