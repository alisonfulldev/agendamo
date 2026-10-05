import { NichePage, nicheMetadata } from "@/components/sales/niche-page";

export const metadata = nicheMetadata("personal-trainer");

export default function Page() {
  return <NichePage brandKey="personal-trainer" />;
}
