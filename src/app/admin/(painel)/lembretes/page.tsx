import { createAdminClient } from "@/lib/supabase/admin";

import { AdminSection } from "../ui";

const KIND: Record<string, string> = {
  test: "Teste ao ativar",
  reminder_24h: "1 dia antes",
  reminder_2h: "2 horas antes",
};

/**
 * Customer reminders by notification (2026-11-27): delivery in the last 7 days and the devices
 * that receive them. An e-mail alert goes to the admins when more than 25% fail in 24 hours.
 */
export default async function AdminRemindersPage() {
  const admin = createAdminClient();
  const since = new Date(new Date().getTime() - 7 * 86_400_000).toISOString();
  const [{ data: deliveries }, { data: devices }] = await Promise.all([
    admin
      .from("customer_push_deliveries")
      .select("kind, status")
      .gte("created_at", since)
      .limit(20000),
    admin
      .from("customer_push_subscriptions")
      .select("platform")
      .is("expired_at", null)
      .limit(20000),
  ]);
  const rows = deliveries ?? [];
  const byKind = Object.keys(KIND).map((kind) => {
    const list = rows.filter((r) => r.kind === kind);
    const sent = list.filter((r) => r.status === "sent").length;
    return {
      kind,
      total: list.length,
      sent,
      failed: list.filter((r) => r.status === "failed").length,
      expired: list.filter((r) => r.status === "expired").length,
      rate: list.length ? Math.round((sent / list.length) * 100) : null,
    };
  });
  const platforms = { android: 0, ios: 0, other: 0 } as Record<string, number>;
  for (const d of devices ?? [])
    platforms[d.platform as string] = (platforms[d.platform as string] ?? 0) + 1;

  return (
    <>
      <h1 className="text-2xl font-bold">Lembretes por notificação</h1>
      <AdminSection title="Entrega nos últimos 7 dias">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th className="py-2 pr-4">Tipo</th>
                <th className="py-2 pr-4">Enviados</th>
                <th className="py-2 pr-4">Entregues</th>
                <th className="py-2 pr-4">Falharam</th>
                <th className="py-2 pr-4">Aparelho saiu</th>
                <th className="py-2">Taxa de entrega</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {byKind.map((k) => (
                <tr key={k.kind}>
                  <td className="py-2 pr-4">{KIND[k.kind]}</td>
                  <td className="py-2 pr-4">{k.total}</td>
                  <td className="py-2 pr-4">{k.sent}</td>
                  <td className="py-2 pr-4">{k.failed}</td>
                  <td className="py-2 pr-4">{k.expired}</td>
                  <td className="py-2 font-medium">{k.rate === null ? "—" : `${k.rate}%`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          “Aparelho saiu”: o cliente desinstalou o app ou bloqueou as notificações (o aparelho deixa
          de ser usado).
        </p>
      </AdminSection>
      <AdminSection title="Aparelhos ativos">
        <p className="text-sm">
          Android: {platforms.android} · iPhone: {platforms.ios} · Outros: {platforms.other}
        </p>
      </AdminSection>
    </>
  );
}
