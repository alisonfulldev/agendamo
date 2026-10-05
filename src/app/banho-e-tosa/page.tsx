import { NichePage, nicheMetadata } from "@/components/sales/niche-page";

export const metadata = nicheMetadata("pet-grooming");

export default function Page() {
  return <NichePage brandKey="pet-grooming" />;
}
