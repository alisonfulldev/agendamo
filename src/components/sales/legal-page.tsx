import type { BrandConfig } from "@/brands";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import type { ReactNode } from "react";

/** Layout for legal texts. Shows the legal-review notice until the texts are reviewed. */
export function LegalPage({
  title,
  brand,
  path,
  updatedAt,
  children,
}: {
  title: string;
  brand: BrandConfig;
  /** Clean path of the page ("/termos"), for the breadcrumb. */
  path: string;
  updatedAt: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <Breadcrumbs items={[{ name: title, path }]} brand={brand} />
      <h1 className="mt-4 text-3xl font-bold">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">Atualizado em {updatedAt}</p>
      <p
        role="note"
        className="mt-4 rounded-lg border border-dashed p-3 text-sm text-muted-foreground"
      >
        Texto-base para revisão jurídica antes da publicação.
      </p>
      <div className="mt-8 flex flex-col gap-4 leading-relaxed [&_h2]:mt-4 [&_h2]:text-xl [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:pl-6">
        {children}
      </div>
    </main>
  );
}
