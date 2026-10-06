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
}: {
  className?: string;
  children: React.ReactNode;
  tabIndex?: number;
}) {
  return (
    <a
      href="?criar=1"
      className={className}
      tabIndex={tabIndex}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey) return;
        event.preventDefault();
        openCreation();
      }}
    >
      {children}
    </a>
  );
}
