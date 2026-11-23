import { handleRest, queryInput } from "@/lib/api/http";

export const dynamic = "force-dynamic";

export const GET = (request: Request) => handleRest(request, "get_business_info", queryInput);
