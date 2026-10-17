import { nicheSegmentRoute } from "@/components/sales/niche-segment-route";

const route = nicheSegmentRoute("osteopathy");

// /osteopatia/<tema> (guide) or /osteopatia/<cidade> (directory); anything else is a real 404.
export const generateMetadata = route.generateMetadata;
export default route.Page;
