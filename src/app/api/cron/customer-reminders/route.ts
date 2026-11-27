import { cronRoute } from "@/lib/cron";
import { sendCustomerReminders } from "@/lib/push/customer";

/** Every 15 minutes: customer reminders by notification, 1 day and 2 hours before (once each). */
export const POST = cronRoute(async () => sendCustomerReminders());
