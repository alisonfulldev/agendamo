import { NichePage, nicheMetadata } from "@/components/sales/niche-page";

export const metadata = nicheMetadata("dentistry");

export default function Page() {
  return <NichePage brandKey="dentistry" />;
}
