import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { PARTNER_TERMS } from "@/content/partners";
import { getSessionUser } from "@/lib/auth/session";
import { partnerOfUser } from "@/lib/partners/service";

import { PartnerForm } from "./partner-form";

export const metadata: Metadata = { title: "Cadastro de parceiro", robots: { index: false } };

export default async function PartnerSignUpPage() {
  const user = await getSessionUser();
  if (user && (await partnerOfUser(user.id))) redirect("/parceiros/painel");
  return (
    <AuthShell
      title="Seja parceiro"
      description="Cadastro grátis. Você recebe o seu link na hora."
      footer={
        <>
          Já é parceiro?{" "}
          <Link
            href="/parceiros/entrar"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Entrar
          </Link>
        </>
      }
    >
      <PartnerForm terms={PARTNER_TERMS.text} />
    </AuthShell>
  );
}
