import { NichePage, nicheMetadata } from "@/components/sales/niche-page";

export const metadata = nicheMetadata("yoga");

export default function Page() {
  return <NichePage brandKey="yoga" />;
}
