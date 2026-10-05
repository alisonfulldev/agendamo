import { NichePage, nicheMetadata } from "@/components/sales/niche-page";

export const metadata = nicheMetadata("podiatry");

export default function Page() {
  return <NichePage brandKey="podiatry" />;
}
