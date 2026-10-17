import { nicheSegmentRoute } from "@/components/sales/niche-segment-route";

const route = nicheSegmentRoute("physio");

// /fisioterapia/<tema> (guide) or /fisioterapia/<cidade> (directory); anything else is a real 404.
export const generateMetadata = route.generateMetadata;
export default route.Page;
