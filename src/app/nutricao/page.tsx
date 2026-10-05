import { NichePage, nicheMetadata } from "@/components/sales/niche-page";

export const metadata = nicheMetadata("nutrition");

export default function Page() {
  return <NichePage brandKey="nutrition" />;
}
