import { NichePage, nicheMetadata } from "@/components/sales/niche-page";

export const metadata = nicheMetadata("acupuncture");

export default function Page() {
  return <NichePage brandKey="acupuncture" />;
}
