import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { isPlatformAdmin } from "@/lib/admin";
import { getSessionUser } from "@/lib/auth/session";

import { AdminSignInForm } from "./form";

export const metadata: Metadata = { title: "Administração", robots: { index: false } };

/** Platform admin sign-in: e-mail and password, straight to /admin. */
export default async function AdminSignInPage() {
  const user = await getSessionUser();
  if (user && (await isPlatformAdmin(user))) redirect("/admin");
  return (
    <AuthShell title="Administração" description="Entre com seu e-mail e senha.">
      <AdminSignInForm />
    </AuthShell>
  );
}
