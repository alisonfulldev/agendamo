import { NextResponse, type NextRequest } from "next/server";
import QRCode from "qrcode";

import { brandUrl } from "@/brands/urls";
import { getBusinessContext } from "@/lib/business/context";
import { claimNotification } from "@/lib/notifications/owner";

/** QR code of the business page. ?format=svg|png, ?download=1 for a file download. */
export async function GET(request: NextRequest) {
  const context = await getBusinessContext();
  if (!context) return new NextResponse("Not found", { status: 404 });

  const url = brandUrl(context.brand, `/${context.business.slug}`);
  const format = request.nextUrl.searchParams.get("format") === "svg" ? "svg" : "png";
  const download = request.nextUrl.searchParams.get("download") === "1";
  const disposition = download
    ? `attachment; filename="qrcode-${context.business.slug}.${format}"`
    : "inline";
  // "Primeiros passos": downloading the QR code ticks that item.
  if (download)
    await claimNotification(context.business.id, "checklist_qr", "downloaded").catch(() => false);

  if (format === "svg") {
    const svg = await QRCode.toString(url, { type: "svg", margin: 2, errorCorrectionLevel: "M" });
    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Content-Disposition": disposition,
        "Cache-Control": "private, no-store",
      },
    });
  }

  const png = await QRCode.toBuffer(url, {
    type: "png",
    width: 1024,
    margin: 2,
    errorCorrectionLevel: "M",
  });
  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": disposition,
      "Cache-Control": "private, no-store",
    },
  });
}
