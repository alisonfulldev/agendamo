"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Reloads the page data every few seconds, so it says "confirmado" as soon as the Pix lands. */
export function RefreshWhilePending() {
  const router = useRouter();
  useEffect(() => {
    const timer = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(timer);
  }, [router]);
  return null;
}
