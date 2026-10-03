import Link from "next/link";
import type { ReactNode } from "react";

import { getCurrentBrand } from "@/brands/server";

/** Centered card with the brand of the current domain, for sign-in and sign-up screens. */
export async function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const brand = await getCurrentBrand();
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-10">
      <Link href="/" className="flex items-center gap-2 font-heading text-lg font-semibold">
        {/* eslint-disable-next-line @next/next/no-img-element -- small static SVG logo */}
        <img src={brand.logo} alt="" width={36} height={36} />
        <span>{brand.name}</span>
      </Link>
      <div className="w-full max-w-sm rounded-2xl border bg-card p-6 text-card-foreground shadow-sm">
        <h1 className="text-2xl font-bold">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
        <div className="mt-6">{children}</div>
      </div>
      {footer ? <div className="text-sm text-muted-foreground">{footer}</div> : null}
    </main>
  );
}
