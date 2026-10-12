import type { Metadata } from "next";

import { signOutAction } from "@/app/(auth)/actions";
import { PLATFORM } from "@/brands";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/admin";

import { AdminNav } from "./nav";

export const metadata: Metadata = { title: "Administração", robots: { index: false } };

/** Platform admin: menu on the side, every page checks the admin again (requireAdmin). */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <div className="flex min-h-full flex-1 flex-col bg-muted/40">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- small static SVG logo */}
            <img src={PLATFORM.logo} alt="" width={28} height={28} />
            <span className="font-heading font-semibold">MeetChat · Administração</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">{admin.email}</span>
            <form action={signOutAction}>
              <Button type="submit" variant="ghost" size="sm">
                Sair
              </Button>
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 md:flex-row">
        <aside className="md:w-48 md:shrink-0">
          <AdminNav />
        </aside>
        <main className="flex min-w-0 flex-1 flex-col gap-6">{children}</main>
      </div>
    </div>
  );
}
