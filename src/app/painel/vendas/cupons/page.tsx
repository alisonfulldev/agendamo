import type { Metadata } from "next";

import { ActionButton } from "@/components/panel/action-button";
import { PageHeader, Section } from "@/components/panel/page-header";
import { Badge } from "@/components/ui/badge";
import { requireOwner } from "@/lib/business/context";
import type { BusinessCoupon } from "@/lib/db/types";
import { formatBRL } from "@/lib/money";
import { isCouponActive } from "@/lib/sales/settings";
import { createClient } from "@/lib/supabase/server";

import { deleteCouponAction } from "../actions";
import { CouponForm } from "../forms";

export const metadata: Metadata = { title: "Cupons" };

export default async function CouponsPage() {
  const { business } = await requireOwner();
  const supabase = await createClient();
  const { data } = await supabase
    .from("business_coupons")
    .select("*")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });
  const coupons = (data ?? []) as BusinessCoupon[];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Cupons"
        description="A cliente digita o código no chat de agendamento. Cupons vencidos ou esgotados são recusados."
      />
      <Section title="Novo cupom">
        <CouponForm />
      </Section>
      <Section title="Seus cupons">
        {coupons.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum cupom ainda.</p>
        ) : (
          <ul className="divide-y text-sm">
            {coupons.map((c) => {
              const expired = !isCouponActive(c);
              return (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <span>
                    <span className="font-mono font-semibold">{c.code}</span>{" "}
                    {expired ? <Badge variant="secondary">Encerrado</Badge> : null}
                    <span className="block text-muted-foreground">
                      {c.discount_type === "percent"
                        ? `${c.discount_value}%`
                        : formatBRL(c.discount_value)}{" "}
                      de desconto · usado {c.uses}
                      {c.max_uses ? ` de ${c.max_uses}` : ""} vez(es)
                      {c.valid_until
                        ? ` · até ${c.valid_until.slice(0, 10).split("-").reverse().join("/")}`
                        : ""}
                    </span>
                  </span>
                  <ActionButton
                    size="sm"
                    variant="ghost"
                    confirmText={`Excluir o cupom ${c.code}?`}
                    action={deleteCouponAction.bind(null, c.id)}
                  >
                    Excluir
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
