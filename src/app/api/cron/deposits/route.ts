import { cronRoute } from "@/lib/cron";
import { expireDepositHolds, remindPendingReceipts } from "@/lib/deposits/receipts";

/**
 * Every 5 minutes: reservations that ended without a receipt free the time ("Seu horário
 * expirou"), and receipts still not checked get reminders to the team after the configured hours
 * (each reminder once). Pre-confirmed times are never confirmed or freed automatically.
 */
export const POST = cronRoute(async () => {
  const expired = await expireDepositHolds();
  const reminders = await remindPendingReceipts();
  return { expired, reminders };
});
