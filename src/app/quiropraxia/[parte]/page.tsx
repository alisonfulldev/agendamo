import { nicheSegmentRoute } from "@/components/sales/niche-segment-route";

const route = nicheSegmentRoute("chiropractic");

// /quiropraxia/<tema> (guide) or /quiropraxia/<cidade> (directory); anything else is a real 404.
export const generateMetadata = route.generateMetadata;
export default route.Page;
