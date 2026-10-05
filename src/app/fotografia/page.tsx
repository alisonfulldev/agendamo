import { NichePage, nicheMetadata } from "@/components/sales/niche-page";

export const metadata = nicheMetadata("photography");

export default function Page() {
  return <NichePage brandKey="photography" />;
}
