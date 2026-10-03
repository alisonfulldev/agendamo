import { NextResponse, type NextRequest } from "next/server";

import { audit } from "@/lib/audit";
import { getSessionUser } from "@/lib/auth/session";
import { exchangeCode, saveConnection } from "@/lib/google/client";
import { verifySignedToken } from "@/lib/signed-token";

interface State extends Record<string, unknown> {
  p: string;
  b: string;
  u: string;
  o: string;
  e: number;
}

/** Google OAuth redirect: verifies the signed state, stores encrypted tokens, back to Integrations. */
export async function GET(request: NextRequest) {
  const back = (status: string) =>
    NextResponse.redirect(new URL(`/painel/integracoes?google=${status}`, request.url));
  const state = verifySignedToken<State>(request.nextUrl.searchParams.get("state"));
  const code = request.nextUrl.searchParams.get("code");
  if (!state || !code || state.e < Date.now()) return back("erro");

  const user = await getSessionUser();
  if (!user || user.id !== state.u) return back("erro");

  try {
    const tokens = await exchangeCode(code, state.o);
    await saveConnection({ businessId: state.b, professionalId: state.p, tokens });
    await audit({
      businessId: state.b,
      userId: user.id,
      action: "calendar.connected",
      details: { professional_id: state.p },
    });
    return back("conectado");
  } catch (error) {
    console.error("google callback failed", error);
    return back("erro");
  }
}
