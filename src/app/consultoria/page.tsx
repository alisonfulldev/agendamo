import { NichePage, nicheMetadata } from "@/components/sales/niche-page";

export const metadata = nicheMetadata("consulting");

export default function Page() {
  return <NichePage brandKey="consulting" />;
}
