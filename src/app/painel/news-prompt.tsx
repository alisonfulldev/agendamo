"use client";

import { Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ANNOUNCEMENT_POPUP } from "@/content/site-plan-announcement";

import { claimPromptSlot } from "./prompt-slot";

const SEEN_KEY = "mc_news_site_plan";
const TOUR_STEP_KEY = "lv_tour_step";
const DELAY_MS = 800;

/**
 * One-time "Site + Agenda" news (2026-11-06) for accounts created before it. Shown once per
 * device, never during the tutorial, and it takes the day's popup slot before the others.
 */
export function NewsPrompt({ group }: { group: keyof typeof ANNOUNCEMENT_POPUP }) {
  const [open, setOpen] = useState(false);
  const copy = ANNOUNCEMENT_POPUP[group];

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        if (localStorage.getItem(SEEN_KEY)) return;
        if (sessionStorage.getItem(TOUR_STEP_KEY) !== null) return;
      } catch {
        return;
      }
      if (!claimPromptSlot("news")) return;
      setOpen(true);
    }, DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  function close() {
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {
      // Private mode: it may show again.
    }
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <span className="mx-auto mb-1 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Sparkles className="size-6" aria-hidden />
          </span>
          <DialogTitle className="text-center">{copy.title}</DialogTitle>
          <DialogDescription className="text-center">{copy.text}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button asChild size="lg" onClick={close}>
            <Link href={copy.cta.href}>{copy.cta.label}</Link>
          </Button>
          <Button type="button" variant="ghost" onClick={close}>
            Agora não
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
