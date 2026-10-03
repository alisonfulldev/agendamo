import type { Metadata } from "next";

import { ActionButton } from "@/components/panel/action-button";
import { PageHeader, Section } from "@/components/panel/page-header";
import { Badge } from "@/components/ui/badge";
import { requireOwner } from "@/lib/business/context";
import { formatBRL } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";

import { togglePackageAction } from "../actions";
import { PackageForm } from "../forms";

export const metadata: Metadata = { title: "Pacotes" };

export default async function PackagesPage() {
  const { business } = await requireOwner();
  const supabase = await createClient();
  const [packages, services, sold] = await Promise.all([
    supabase
      .from("packages")
      .select("*, service:services(name)")
      .eq("business_id", business.id)
      .order("created_at"),
    supabase
      .from("services")
      .select("id, name")
      .eq("business_id", business.id)
      .eq("active", true)
      .order("position"),
    supabase
      .from("customer_packages")
      .select("package_id, sessions_left")
      .eq("business_id", business.id),
  ]);
  const soldBy = new Map<string, { count: number; open: number }>();
  for (const s of sold.data ?? []) {
    const entry = soldBy.get(s.package_id as string) ?? { count: 0, open: 0 };
    entry.count++;
    if ((s.sessions_left as number) > 0) entry.open++;
    soldBy.set(s.package_id as string, entry);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Pacotes"
        description="Venda sessões adiantadas (o pagamento é combinado com a cliente, fora da plataforma). A sessão é descontada ao concluir o atendimento."
      />
      <Section title="Novo pacote">
        <PackageForm services={(services.data ?? []) as { id: string; name: string }[]} />
      </Section>
      <Section title="Seus pacotes" description="Para vender, abra a ficha da cliente em Clientes.">
        {(packages.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum pacote ainda.</p>
        ) : (
          <ul className="divide-y text-sm">
            {(packages.data ?? []).map((p) => {
              const stats = soldBy.get(p.id as string) ?? { count: 0, open: 0 };
              return (
                <li
                  key={p.id as string}
                  className="flex flex-wrap items-center justify-between gap-2 py-3"
                >
                  <span>
                    <span className="font-medium">{p.name as string}</span>{" "}
                    {!p.active ? <Badge variant="secondary">Inativo</Badge> : null}
                    <span className="block text-muted-foreground">
                      {(p.service as { name: string } | null)?.name} · {p.sessions as number}{" "}
                      sessões · {formatBRL(p.price_cents as number)} · vendidos: {stats.count} (
                      {stats.open} com saldo)
                    </span>
                  </span>
                  <ActionButton
                    size="sm"
                    variant="ghost"
                    action={togglePackageAction.bind(null, p.id as string, !p.active)}
                  >
                    {p.active ? "Desativar" : "Ativar"}
                  </ActionButton>
                </li>
              );
            })}
          </ul>
        )}
      </Section>
    </div>
  );
}
