import { NichePage, nicheMetadata } from "@/components/sales/niche-page";

export const metadata = nicheMetadata("psychology");

export default function Page() {
  return <NichePage brandKey="psychology" />;
}
