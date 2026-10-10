"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";

import { isCreationOpen, subscribeCreation } from "./creation-store";

// The overlay's code is loaded only when it opens (a button, ?criar=1, ?nome= or ?ramo=).
const CreationChat = dynamic(() => import("./creation-chat").then((m) => m.CreationChat), {
  ssr: false,
});

/** The creation conversation over the page, loaded on demand. */
export function LazyCreationChat({ photos }: { photos: boolean }) {
  const open = useSyncExternalStore(subscribeCreation, isCreationOpen, () => false);
  return open ? <CreationChat photos={photos} /> : null;
}
