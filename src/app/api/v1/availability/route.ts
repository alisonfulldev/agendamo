import { handleRest, queryInput } from "@/lib/api/http";

export const dynamic = "force-dynamic";

/** ?service_ids=a,b[&professional_id=][&date=AAAA-MM-DD]: with date, the times; without, the days. */
export async function GET(request: Request) {
  const hasDate = new URL(request.url).searchParams.has("date");
  return handleRest(request, hasDate ? "list_available_times" : "list_available_days", queryInput);
}
