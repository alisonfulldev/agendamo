"use client";

import { openCreation } from "./creation-store";

/**
 * Call to action that opens the creation conversation over the page. A real link to `?criar=1`,
 * so it also works opened in a new tab or before the page is interactive.
 */
export function OpenCreationLink({
  className,
  children,
  tabIndex,
  niche,
}: {
  className?: string;
  children: React.ReactNode;
  tabIndex?: number;
  /** Niche page route: the conversation opens with the niche already chosen. */
  niche?: string;
}) {
  return (
    <a
      href={niche ? `?criar=1&ramo=${niche}` : "?criar=1"}
      className={className}
      tabIndex={tabIndex}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey) return;
        event.preventDefault();
        openCreation(niche);
      }}
    >
      {children}
    </a>
  );
}
