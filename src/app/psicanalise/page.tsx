import { NichePage, nicheMetadata } from "@/components/sales/niche-page";

export const metadata = nicheMetadata("psychoanalysis");

export default function Page() {
  return <NichePage brandKey="psychoanalysis" />;
}
