import "server-only";

import { cookies, headers } from "next/headers";

import { BOT_PATTERN } from "@/lib/tracking/events";

import {
  assignVariant,
  BUCKET_HEADER,
  EXPERIMENT_COOKIE,
  experimentForPath,
  parseBucket,
} from "./experiments";

/**
 * The visitor's variant of the experiment running on a path (null when none runs there). Bots
 * and visitors without the cookie (first request) get the control.
 */
export async function experimentVariant(path: string) {
  const experiment = experimentForPath(path);
  if (!experiment) return null;
  const requestHeaders = await headers();
  const bot = BOT_PATTERN.test(requestHeaders.get("user-agent") ?? "");
  const bucket = bot
    ? null
    : parseBucket(
        (await cookies()).get(EXPERIMENT_COOKIE)?.value ?? requestHeaders.get(BUCKET_HEADER),
      );
  const variant = assignVariant(experiment, bucket);
  return { experiment: experiment.id, variant, label: `${experiment.id}:${variant.id}` };
}
