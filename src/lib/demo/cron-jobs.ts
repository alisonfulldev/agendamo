/** Scheduled jobs (/api/cron/*) that the demo page can run on demand. */
export const CRON_JOBS = [
  "deposits",
  "customer-reminders",
  "trial",
  "daily-alert",
  "weekly-summary",
  "empty-slots",
  "stats",
  "portal-stats",
  "cleanup",
] as const;
