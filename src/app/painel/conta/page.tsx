import type { Metadata } from "next";

import { PageHeader, Section } from "@/components/panel/page-header";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { getBusinessContext } from "@/lib/business/context";

import { ChangePasswordForm, DeleteAccountDialog } from "./forms";

export const metadata: Metadata = { title: "Conta" };

export default async function AccountPage() {
  const user = await requireUser();
  const context = await getBusinessContext();
  const isOwner = Boolean(context?.isOwner);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Conta" description={user.email} />
      <Section title="Senha">
        <ChangePasswordForm />
      </Section>
      {isOwner ? (
        <Section
          title="Exportar dados"
          description="Uma cópia de todos os dados do seu negócio (LGPD)."
        >
          <div className="flex flex-wrap gap-2 text-sm">
            <Button asChild variant="outline">
              <a href="/painel/conta/exportar?formato=json" download>
                Tudo (JSON)
              </a>
            </Button>
            {["customers", "appointments", "services", "booking_requests", "reviews"].map(
              (table) => (
                <Button key={table} asChild variant="ghost">
                  <a href={`/painel/conta/exportar?formato=csv&tabela=${table}`} download>
                    {
                      {
                        customers: "Clientes",
                        appointments: "Agendamentos",
                        services: "Serviços",
                        booking_requests: "Pedidos",
                        reviews: "Avaliações",
                      }[table]
                    }{" "}
                    (CSV)
                  </a>
                </Button>
              ),
            )}
          </div>
        </Section>
      ) : null}
      <Section
        title="Excluir conta"
        description={
          isOwner
            ? "Apaga o negócio, a página, a agenda, os clientes e as fotos. Não dá para desfazer."
            : "Apaga seu acesso. Não dá para desfazer."
        }
      >
        <DeleteAccountDialog
          confirmationWord={isOwner ? context!.business.slug : "excluir"}
          hasBusiness={isOwner}
        />
      </Section>
    </div>
  );
}
