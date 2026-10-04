import { NichePage, nicheMetadata } from "@/components/sales/niche-page";

export const metadata = nicheMetadata("aesthetics");

export default function Page() {
  return <NichePage brandKey="aesthetics" />;
}
