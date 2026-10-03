import * as Sentry from "@sentry/nextjs";

import { getSentryDsn } from "@/lib/env";

const dsn = getSentryDsn();

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1,
});
