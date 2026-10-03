import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { getCurrentBrand } from "@/brands/server";
import { brandUrl } from "@/brands/urls";
import { loadAppointmentDetails, serviceNames } from "@/lib/booking/details";
import { createAdminClient } from "@/lib/supabase/admin";

import { ReviewForm } from "./review-form";

export const metadata: Metadata = { title: "Avaliar atendimento", robots: { index: false } };

export default async function ReviewPage({ params }: PageProps<"/avaliar/[token]">) {
  const { token } = await params;
  if (!/^[0-9a-f]{32}$/.test(token)) notFound();
  const { data: row } = await createAdminClient()
    .from("review_tokens")
    .select("appointment_id, used_at, expires_at")
    .eq("token", token)
    .maybeSingle();
  if (!row) notFound();
  const details = await loadAppointmentDetails(row.appointment_id as string);
  if (!details) notFound();

  const domainBrand = await getCurrentBrand();
  if (domainBrand.key !== details.brand.key) redirect(brandUrl(details.brand, `/avaliar/${token}`));

  const unusable = row.used_at !== null || new Date(row.expires_at as string) < new Date();
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-5 py-12">
      <div>
        <p className="text-sm text-muted-foreground">{details.business.name}</p>
        <h1 className="text-2xl font-bold">Como foi seu atendimento?</h1>
        <p className="mt-1 text-muted-foreground">{serviceNames(details)}</p>
      </div>
      {unusable ? (
        <p className="rounded-lg bg-muted p-4">Este link já foi usado ou expirou. Obrigada!</p>
      ) : (
        <ReviewForm token={token} businessName={details.business.name} />
      )}
    </main>
  );
}
