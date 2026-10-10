import { LockedPage } from "@/components/panel/locked-page";
import { requireBusiness } from "@/lib/business/context";
import { getPlanFeatures } from "@/lib/plans";

/** Financeiro: paid feature. On the Grátis plan the whole section shows the lock. */
export default async function Layout({ children }: { children: React.ReactNode }) {
  const { business } = await requireBusiness();
  const features = getPlanFeatures(business);
  if (!features.finance) {
    return <LockedPage feature="finance" trialAvailable={features.trialAvailable} />;
  }
  return children;
}
