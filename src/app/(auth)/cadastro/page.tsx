import type { Metadata } from "next";
import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { SignedInNotice } from "@/components/auth/signed-in-notice";
import { getSessionUser } from "@/lib/auth/session";

import { SignUpForm } from "../forms";
import { PRICE_TEXT } from "@/lib/plans";

export const metadata: Metadata = { title: "Criar conta", robots: { index: false } };

export default async function SignUpPage() {
  const user = await getSessionUser();
  return (
    <AuthShell
      title="Criar sua conta"
      description={`${PRICE_TEXT.trial}. Leva poucos minutos.`}
      footer={
        <>
          Já tem conta?{" "}
          <Link
            href="/entrar"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Entrar
          </Link>
        </>
      }
    >
      {user ? <SignedInNotice user={user} here="/cadastro" /> : null}
      <SignUpForm />
    </AuthShell>
  );
}
