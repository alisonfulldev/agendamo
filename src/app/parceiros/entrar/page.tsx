import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { CodeSignIn } from "@/components/auth/code-sign-in";
import { getSessionUser } from "@/lib/auth/session";
import { partnerOfUser } from "@/lib/partners/service";

export const metadata: Metadata = { title: "Entrar como parceiro", robots: { index: false } };

export default async function PartnerSignInPage() {
  const user = await getSessionUser();
  if (user && (await partnerOfUser(user.id))) redirect("/parceiros/painel");
  return (
    <AuthShell
      title="Área do parceiro"
      description="Entre com o e-mail do seu cadastro de parceiro."
      footer={
        <>
          Ainda não é parceiro?{" "}
          <Link
            href="/parceiros/cadastro"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Cadastre-se grátis
          </Link>
        </>
      }
    >
      <CodeSignIn next="/parceiros/painel" />
    </AuthShell>
  );
}
