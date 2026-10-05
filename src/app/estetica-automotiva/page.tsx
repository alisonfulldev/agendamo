import { NichePage, nicheMetadata } from "@/components/sales/niche-page";

export const metadata = nicheMetadata("auto-detailing");

export default function Page() {
  return <NichePage brandKey="auto-detailing" />;
}
