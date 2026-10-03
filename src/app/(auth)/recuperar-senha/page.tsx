import type { Metadata } from "next";
import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";

import { RequestResetForm } from "../forms";

export const metadata: Metadata = { title: "Esqueci minha senha", robots: { index: false } };

export default function RequestResetPage() {
  return (
    <AuthShell
      title="Esqueci minha senha"
      description="Enviamos um link para você escolher uma nova senha."
      footer={
        <Link
          href="/entrar"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Voltar para entrar
        </Link>
      }
    >
      <RequestResetForm />
    </AuthShell>
  );
}
