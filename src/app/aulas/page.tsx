import { NichePage, nicheMetadata } from "@/components/sales/niche-page";

export const metadata = nicheMetadata("tutoring");

export default function Page() {
  return <NichePage brandKey="tutoring" />;
}
