import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/panel/page-header";
import { UpgradeNotice } from "@/components/panel/upgrade-notice";
import { requireOwner } from "@/lib/business/context";
import { getPlanFeatures } from "@/lib/plans";

export const metadata: Metadata = { title: "Vendas" };

const TOOLS = [
  {
    href: "/painel/vendas/reativacao",
    title: "Reativação e retorno",
    text: "Quem sumiu, quem está na hora de voltar e aniversariantes.",
  },
  {
    href: "/painel/vendas/quase-agendaram",
    title: "Quase agendaram",
    text: "Quem começou a agendar e não concluiu.",
  },
  {
    href: "/painel/vendas/lista-espera",
    title: "Lista de espera",
    text: "Avisada sozinha quando abre um horário.",
  },
  {
    href: "/painel/vendas/indicacoes",
    title: "Indicações",
    text: "Cliente trazendo cliente, com recompensa.",
  },
  {
    href: "/painel/vendas/pacotes",
    title: "Pacotes",
    text: "Sessões vendidas com saldo por cliente.",
  },
  { href: "/painel/vendas/cupons", title: "Cupons", text: "Descontos aplicados no agendamento." },
  {
    href: "/painel/vendas/artes",
    title: "Artes para divulgar",
    text: "Stories com horários livres, novidades e ofertas.",
  },
];

export default async function SalesPage() {
  const { business } = await requireOwner();
  const features = getPlanFeatures(business);
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Vendas"
        description="Ferramentas para encher a agenda e trazer clientes de volta."
      />
      {!features.salesTools ? (
        <UpgradeNotice
          features={features}
          title="Ferramentas de venda"
          description="Reativação, lista de espera, indicações, pacotes, cupons e artes prontas para divulgar."
        />
      ) : null}
      <ul className="grid gap-3 sm:grid-cols-2">
        {TOOLS.map((tool) => (
          <li key={tool.href}>
            <Link
              href={tool.href}
              className="block rounded-xl border bg-card p-5 hover:border-primary"
            >
              <span className="font-semibold">{tool.title}</span>
              <span className="mt-1 block text-sm text-muted-foreground">{tool.text}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
