import type { Metadata } from "next";
import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { CodeSignIn } from "@/components/auth/code-sign-in";
import { SignedInNotice } from "@/components/auth/signed-in-notice";
import { getSessionUser } from "@/lib/auth/session";

import { SignInForm } from "../forms";

export const metadata: Metadata = { title: "Entrar", robots: { index: false } };

export default async function SignInPage({ searchParams }: PageProps<"/entrar">) {
  const { next, erro } = await searchParams;
  const user = await getSessionUser();
  return (
    <AuthShell
      title="Entrar"
      description="Acesse o painel do seu negócio."
      footer={
        <>
          Ainda não tem conta?{" "}
          <Link
            href="/?criar=1"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Criar meu link grátis
          </Link>
        </>
      }
    >
      {erro === "link" ? (
        <p
          role="alert"
          className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          Esse link expirou ou já foi usado. Entre com um código ou peça um novo link.
        </p>
      ) : null}
      {user ? <SignedInNotice user={user} here="/entrar" /> : null}
      <CodeSignIn next={typeof next === "string" ? next : undefined} />
      <details className="mt-6 border-t pt-4">
        <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
          Entrar com senha
        </summary>
        <div className="mt-4">
          <SignInForm next={typeof next === "string" ? next : undefined} />
        </div>
      </details>
    </AuthShell>
  );
}
