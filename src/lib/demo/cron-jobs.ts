/** Scheduled jobs (/api/cron/*) that the demo page can run on demand. */
export const CRON_JOBS = [
  "reminders",
  "deposits",
  "trial",
  "daily-alert",
  "weekly-summary",
  "empty-slots",
  "marketing",
  "stats",
  "portal-stats",
  "cleanup",
] as const;
