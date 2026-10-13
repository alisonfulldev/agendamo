import { permanentRedirect } from "next/navigation";

/** Prices are not public (2026-10-13): they show up in the panel's Assinatura after sign-up. */
export default function PricingPage() {
  permanentRedirect("/");
}
