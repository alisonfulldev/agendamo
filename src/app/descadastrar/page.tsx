import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimitRequest } from "@/lib/rate-limit";
import { readUnsubscribeToken, unsubscribe } from "@/lib/unsubscribe";

export const metadata: Metadata = { title: "Descadastrar", robots: { index: false } };

async function confirmAction(formData: FormData) {
  "use server";
  const token = String(formData.get("t") ?? "");
  const target = readUnsubscribeToken(token);
  if (target && (await rateLimitRequest("publicAction", "unsubscribe")))
    await unsubscribe(target.email, target.businessId);
  redirect(`/descadastrar?t=${encodeURIComponent(token)}&ok=1`);
}

/** Public unsubscribe page. GET only shows a button (link scanners must not unsubscribe people). */
export default async function UnsubscribePage({ searchParams }: PageProps<"/descadastrar">) {
  const { t, ok } = await searchParams;
  const token = typeof t === "string" ? t : "";
  const target = readUnsubscribeToken(token);

  let businessName = "este negócio";
  if (target) {
    const { data } = await createAdminClient()
      .from("businesses")
      .select("name")
      .eq("id", target.businessId)
      .maybeSingle();
    if (data?.name) businessName = data.name as string;
  }

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
          <p className="text-muted-foreground">
            Você não vai mais receber novidades de {businessName} em {target.email}. Avisos dos seus
            agendamentos continuam chegando.
          </p>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold">Parar de receber novidades?</h1>
          <p className="max-w-sm text-muted-foreground">
            {target.email} deixará de receber e-mails de novidades e lembretes de retorno de{" "}
            {businessName}.
          </p>
          <form action={confirmAction}>
            <input type="hidden" name="t" value={token} />
            <Button type="submit" className="h-11">
              Confirmar descadastro
            </Button>
          </form>
        </>
      )}
    </main>
  );
}
