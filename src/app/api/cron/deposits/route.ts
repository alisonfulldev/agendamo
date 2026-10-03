import { cancelAppointment } from "@/lib/booking/manage";
import { cronRoute } from "@/lib/cron";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Every 5 minutes: cancels bookings whose deposit deadline passed without payment and frees the
 * slot. Bookings where the customer said "Já paguei" wait for the owner to check.
 */
export const POST = cronRoute(async () => {
  const { data, error } = await createAdminClient()
    .from("appointments")
    .select("id")
    .eq("status", "awaiting_deposit")
    .eq("deposit_status", "waiting")
    .lt("deposit_expires_at", new Date().toISOString());
  if (error) throw new Error(error.message);
  let cancelled = 0;
  for (const row of data ?? []) {
    if (
      await cancelAppointment(row.id as string, "business", "O sinal não foi pago dentro do prazo")
    )
      cancelled++;
  }
  return { cancelled };
});
