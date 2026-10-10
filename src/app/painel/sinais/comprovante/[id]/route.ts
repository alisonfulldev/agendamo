import { NextResponse } from "next/server";

import { getBusinessContext } from "@/lib/business/context";
import { RECEIPT_MAX_BYTES } from "@/lib/deposits/receipt-file";
import { readObject } from "@/lib/storage/r2";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * The receipt itself, only for the owner of the business: read from storage on the server and
 * served directly (never a redirect to the public storage address), never cached.
 */
export async function GET(
  _request: Request,
  { params }: RouteContext<"/painel/sinais/comprovante/[id]">,
) {
  const { id } = await params;
  const context = await getBusinessContext();
  if (!context?.isOwner || !/^[0-9a-f-]{36}$/.test(id))
    return new NextResponse("Not found", { status: 404 });
  const { data } = await createAdminClient()
    .from("deposit_receipts")
    .select("object_key, content_type")
    .eq("id", id)
    .eq("business_id", context.business.id)
    .maybeSingle();
  if (!data?.object_key || !data.content_type)
    return new NextResponse("Not found", { status: 404 });
  const bytes = await readObject(data.object_key as string, RECEIPT_MAX_BYTES);
  if (!bytes) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": data.content_type as string,
      "Content-Disposition": "inline",
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      "Referrer-Policy": "no-referrer",
    },
  });
}
