import { formatInTimeZone } from "date-fns-tz";

import { BRANDS, getNiche } from "@/brands";
import { createAdminClient } from "@/lib/supabase/admin";

import { CouponForm } from "../../admin-actions";
import { AdminSection } from "../ui";

interface CouponRow {
  code: string;
  discount_percent: number;
  valid_until: string | null;
  max_uses: number | null;
  uses: number;
  brand_key: string | null;
  created_at: string;
}

/** Subscription coupons: create and see how each one is being used. */
export default async function AdminCouponsPage() {
  const { data } = await createAdminClient()
    .from("platform_coupons")
    .select("*")
    .order("created_at", { ascending: false });
  const coupons = (data ?? []) as CouponRow[];
  const now = new Date();

  return (
    <>
      <h1 className="text-2xl font-bold">Cupons</h1>
      <AdminSection title="Novo cupom" description="Desconto na assinatura do Completo.">
        <CouponForm
          brands={BRANDS.filter((b) => b.niche).map((b) => ({ key: b.key, name: b.niche!.name }))}
        />
      </AdminSection>
      <AdminSection title={`Cupons (${coupons.length})`}>
        {coupons.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum cupom criado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr className="border-b">
                  <th className="py-2 pr-3 font-medium">Código</th>
                  <th className="py-2 pr-3 text-right font-medium">Desconto</th>
                  <th className="py-2 pr-3 text-right font-medium">Usos</th>
                  <th className="py-2 pr-3 font-medium">Válido até</th>
                  <th className="py-2 font-medium">Nicho</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {coupons.map((c) => {
                  const expired = c.valid_until && new Date(c.valid_until) < now;
                  const exhausted = c.max_uses !== null && c.uses >= c.max_uses;
                  return (
                    <tr
                      key={c.code}
                      className={expired || exhausted ? "text-muted-foreground" : ""}
                    >
                      <td className="py-2 pr-3 font-mono font-medium">{c.code}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{c.discount_percent}%</td>
                      <td className="py-2 pr-3 text-right tabular-nums">
                        {c.uses}
                        {c.max_uses !== null ? ` de ${c.max_uses}` : ""}
                      </td>
                      <td className="py-2 pr-3">
                        {c.valid_until
                          ? formatInTimeZone(
                              new Date(c.valid_until),
                              "America/Sao_Paulo",
                              "dd/MM/yy",
                            )
                          : "Sem prazo"}
                        {expired ? " (vencido)" : exhausted ? " (esgotado)" : ""}
                      </td>
                      <td className="py-2">
                        {c.brand_key ? (getNiche(c.brand_key).niche?.name ?? c.brand_key) : "Todos"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </AdminSection>
    </>
  );
}
