import { handleRest } from "@/lib/api/http";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: RouteContext<"/api/v1/appointments/[id]/cancel">,
) {
  const { id } = await params;
  return handleRest(request, "cancel_appointment", async (r) => ({
    ...((await r.json().catch(() => ({}))) as object),
    appointment_id: id,
  }));
}
