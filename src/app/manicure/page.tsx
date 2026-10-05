import { NichePage, nicheMetadata } from "@/components/sales/niche-page";

export const metadata = nicheMetadata("nails");

export default function Page() {
  return <NichePage brandKey="nails" />;
}
