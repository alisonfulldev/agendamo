import { NichePage, nicheMetadata } from "@/components/sales/niche-page";

export const metadata = nicheMetadata("chiropractic");

export default function Page() {
  return <NichePage brandKey="chiropractic" />;
}
