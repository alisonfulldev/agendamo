import { PortalListingPage, portalListingMetadata } from "@/lib/portal/listing-page";

// /explorar/<cidade>/<bairro>/<servico> ("parte" is the neighborhood here).

export async function generateMetadata({
  params,
}: PageProps<"/explorar/[cidade]/[parte]/[servico]">) {
  const { cidade, parte, servico } = await params;
  return portalListingMetadata({ city: cidade, neighborhood: parte, service: servico });
}

export default async function NeighborhoodServicePage({
  params,
}: PageProps<"/explorar/[cidade]/[parte]/[servico]">) {
  const { cidade, parte, servico } = await params;
  return PortalListingPage({ city: cidade, neighborhood: parte, service: servico });
}
