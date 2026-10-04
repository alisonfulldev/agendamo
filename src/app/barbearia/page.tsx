import { NichePage, nicheMetadata } from "@/components/sales/niche-page";

export const metadata = nicheMetadata("barber");

export default function Page() {
  return <NichePage brandKey="barber" />;
}
