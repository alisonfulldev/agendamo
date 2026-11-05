import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { optOut, readOptOutToken } from "@/lib/notifications/opt-out";
import { OWNER_NOTIFICATION_TYPES } from "@/lib/notifications/owner-types";
import { rateLimitRequest } from "@/lib/rate-limit";

export const metadata: Metadata = { title: "Parar de receber", robots: { index: false } };

async function confirmAction(formData: FormData) {
  "use server";
  const token = String(formData.get("t") ?? "");
  const target = readOptOutToken(token);
  if (target && (await rateLimitRequest("publicAction", "unsubscribe")))
    await optOut(target.userId, target.type);
  redirect(`/avisos/desligar?t=${encodeURIComponent(token)}&ok=1`);
}

/** Owner opt-out of a kind of e-mail. GET only shows a button (link scanners must not opt out). */
export default async function OwnerOptOutPage({ searchParams }: PageProps<"/avisos/desligar">) {
  const { t, ok } = await searchParams;
  const token = typeof t === "string" ? t : "";
  const target = readOptOutToken(token);
  const label = target ? OWNER_NOTIFICATION_TYPES[target.type] : "";

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      {!target ? (
        <>
          <h1 className="text-2xl font-bold">Link inválido</h1>
          <p className="text-muted-foreground">Use o link que veio no e-mail.</p>
        </>
      ) : ok ? (
        <>
          <h1 className="text-2xl font-bold">Pronto!</h1>
          <p className="max-w-sm text-muted-foreground">
            Você não vai mais receber e-mails de “{label}”. Os avisos dos seus agendamentos
            continuam chegando. Para ligar de novo, use Notificações no painel.
          </p>
          <Button asChild variant="outline">
            <Link href="/painel/notificacoes">Abrir Notificações</Link>
          </Button>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold">Parar de receber “{label}”?</h1>
          <p className="max-w-sm text-muted-foreground">
            Os avisos dos seus agendamentos continuam chegando normalmente.
          </p>
          <form action={confirmAction}>
            <input type="hidden" name="t" value={token} />
            <Button type="submit" className="h-11">
              Parar de receber
            </Button>
          </form>
        </>
      )}
    </main>
  );
}
