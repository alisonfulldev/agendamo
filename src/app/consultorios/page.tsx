import { NichePage, nicheMetadata } from "@/components/sales/niche-page";

export const metadata = nicheMetadata("medical");

export default function Page() {
  return <NichePage brandKey="medical" />;
}
