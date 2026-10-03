import { PortalListingPage, portalListingMetadata } from "@/lib/portal/listing-page";

// /explorar/<cidade>/<servico>. The third level is named "parte" because, one level deeper,
// it is the neighborhood (Next.js requires the same parameter name at the same position).

export async function generateMetadata({ params }: PageProps<"/explorar/[cidade]/[parte]">) {
  const { cidade, parte } = await params;
  return portalListingMetadata({ city: cidade, neighborhood: null, service: parte });
}

export default async function CityServicePage({ params }: PageProps<"/explorar/[cidade]/[parte]">) {
  const { cidade, parte } = await params;
  return PortalListingPage({ city: cidade, neighborhood: null, service: parte });
}
