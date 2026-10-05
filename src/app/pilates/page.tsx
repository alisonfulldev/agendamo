import { NichePage, nicheMetadata } from "@/components/sales/niche-page";

export const metadata = nicheMetadata("pilates");

export default function Page() {
  return <NichePage brandKey="pilates" />;
}
