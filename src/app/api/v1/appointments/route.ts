import { handleRest, jsonBody, queryInput } from "@/lib/api/http";

export const dynamic = "force-dynamic";

/** ?customer_phone=5511999998888: the customer's next active appointments. */
export const GET = (request: Request) => handleRest(request, "find_appointments", queryInput);

export const POST = (request: Request) => handleRest(request, "create_appointment", jsonBody);
