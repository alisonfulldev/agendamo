"use server";

import { requireOwner } from "@/lib/business/context";

import { loadTestBooking, type TestBooking } from "./data";

/** Polled while the owner books herself on her link (another tab): her test booking, once made. */
export async function testBookingAction(): Promise<TestBooking | null> {
  const { business } = await requireOwner({ allowWaiting: true });
  if (!business.activation_demo) return null;
  return loadTestBooking(business.id);
}
