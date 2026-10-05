import { NichePage, nicheMetadata } from "@/components/sales/niche-page";

export const metadata = nicheMetadata("osteopathy");

export default function Page() {
  return <NichePage brandKey="osteopathy" />;
}
