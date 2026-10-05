import { NichePage, nicheMetadata } from "@/components/sales/niche-page";

export const metadata = nicheMetadata("tattoo");

export default function Page() {
  return <NichePage brandKey="tattoo" />;
}
