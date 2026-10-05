import { NichePage, nicheMetadata } from "@/components/sales/niche-page";

export const metadata = nicheMetadata("veterinary");

export default function Page() {
  return <NichePage brandKey="veterinary" />;
}
