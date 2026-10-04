import { NichePage, nicheMetadata } from "@/components/sales/niche-page";

export const metadata = nicheMetadata("physio");

export default function Page() {
  return <NichePage brandKey="physio" />;
}
