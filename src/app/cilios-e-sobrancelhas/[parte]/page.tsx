import { nicheSegmentRoute } from "@/components/sales/niche-segment-route";

const route = nicheSegmentRoute("lash-brow");

// /cilios-e-sobrancelhas/<tema> (guide) or /cilios-e-sobrancelhas/<cidade> (directory); anything else is a real 404.
export const generateMetadata = route.generateMetadata;
export default route.Page;
