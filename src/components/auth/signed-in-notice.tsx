import Link from "next/link";

import { signOutAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import type { SessionUser } from "@/lib/auth/session";

/**
 * Shown on /entrar and /cadastro when someone is already signed in (instead of a silent
 * redirect), so it is clear which account is open and how to use another one.
 */
export function SignedInNotice({ user, here }: { user: SessionUser; here: string }) {
  return (
    <div className="mb-4 flex flex-col gap-3 rounded-lg border bg-accent/40 p-4 text-sm">
      <p>
        Você já está conectada como <strong>{user.email}</strong>.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm">
          <Link href="/painel">Ir para o meu painel</Link>
        </Button>
        <form action={signOutAction}>
          <input type="hidden" name="next" value={here} />
          <Button type="submit" size="sm" variant="outline">
            Sair e usar outra conta
          </Button>
        </form>
      </div>
    </div>
  );
}
