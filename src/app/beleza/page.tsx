import { NichePage, nicheMetadata } from "@/components/sales/niche-page";

export const metadata = nicheMetadata("beauty");

export default function Page() {
  return <NichePage brandKey="beauty" />;
}
