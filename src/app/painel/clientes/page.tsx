import { Download } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/panel/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireBusiness } from "@/lib/business/context";
import type { Customer } from "@/lib/db/types";
import { formatBrPhone } from "@/lib/phone";
import { createClient } from "@/lib/supabase/server";

import { ImportDialog } from "./import-dialog";

export const metadata: Metadata = { title: "Clientes" };

const PAGE_SIZE = 50;

export default async function CustomersPage({ searchParams }: PageProps<"/painel/clientes">) {
  const { business, isOwner, brand } = await requireBusiness();
  const term = brand.terms.customer;
  const title = term.plural.charAt(0).toUpperCase() + term.plural.slice(1);
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 60) : "";
  const page = Math.max(1, Number(params.pagina) || 1);
  const blockedOnly = params.bloqueadas === "1";

  const supabase = await createClient();
  let query = supabase
    .from("customers")
    .select("*", { count: "exact" })
    .eq("business_id", business.id)
    .order("name")
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (q) {
    const digits = q.replace(/\D/g, "");
    query = digits.length >= 4 ? query.like("phone", `%${digits}%`) : query.ilike("name", `%${q}%`);
  }
  if (blockedOnly) query = query.eq("blocked", true);
  const { data, count } = await query;
  const customers = (data ?? []) as Customer[];
  const pages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <div>
      <PageHeader
        title={title}
        description={`${count ?? 0} ${term.plural}${isOwner ? "" : " atendidos por você"}`}
        actions={
          <>
            {isOwner ? <ImportDialog /> : null}
            <Button asChild variant="outline">
              <a href="/painel/clientes/exportar" download>
                <Download /> Exportar CSV
              </a>
            </Button>
          </>
        }
      />
      {params.excluida ? (
        <p
          role="status"
          className="mb-4 rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground"
        >
          Dados da cliente excluídos.
        </p>
      ) : null}
      <form className="mb-4 flex flex-wrap gap-2" role="search">
        <Input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nome ou telefone"
          aria-label="Buscar cliente"
          className="h-10 max-w-xs"
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="bloqueadas"
            value="1"
            defaultChecked={blockedOnly}
            className="accent-primary"
          />
          Só bloqueadas
        </label>
        <Button type="submit" variant="outline">
          Buscar
        </Button>
      </form>
      {customers.length === 0 ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
          Nenhuma cliente encontrada.
        </p>
      ) : (
        <ul className="divide-y rounded-xl border bg-card">
          {customers.map((c) => (
            <li key={c.id}>
              <Link
                href={`/painel/clientes/${c.id}`}
                className="flex items-center justify-between gap-3 p-3 hover:bg-muted"
              >
                <span>
                  <span className="font-medium">{c.name}</span>{" "}
                  {c.blocked ? <Badge variant="destructive">Bloqueada</Badge> : null}
                  <span className="block text-sm text-muted-foreground">
                    {formatBrPhone(c.phone) || c.email || "Sem contato"}
                  </span>
                </span>
                {c.no_show_count > 0 ? (
                  <span className="text-sm text-muted-foreground">{c.no_show_count} falta(s)</span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
      {pages > 1 ? (
        <nav aria-label="Páginas" className="mt-4 flex items-center justify-center gap-3 text-sm">
          {page > 1 ? (
            <Link href={`?q=${encodeURIComponent(q)}&pagina=${page - 1}`}>Anterior</Link>
          ) : null}
          <span>
            Página {page} de {pages}
          </span>
          {page < pages ? (
            <Link href={`?q=${encodeURIComponent(q)}&pagina=${page + 1}`}>Próxima</Link>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}
