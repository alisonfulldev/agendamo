import { GET as icon } from "@/app/icons/[size]/route";

/**
 * /favicon.ico: browsers and search engines ask for it directly. Served as a 48×48 PNG (accepted
 * at this address by every browser), the same mark as the other icons.
 */
export function GET(request: Request) {
  return icon(request, { params: Promise.resolve({ size: "48" }) });
}
