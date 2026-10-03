import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { requireUser } from "@/lib/auth/session";

import { NewPasswordForm } from "../forms";

export const metadata: Metadata = { title: "Nova senha", robots: { index: false } };

/** Reached from the recovery e-mail (/auth/confirm starts the session first). */
export default async function NewPasswordPage() {
  await requireUser("/redefinir-senha");
  return (
    <AuthShell title="Escolha uma nova senha">
      <NewPasswordForm />
    </AuthShell>
  );
}
