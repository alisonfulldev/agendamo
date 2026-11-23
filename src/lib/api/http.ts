import "server-only";

import { NextResponse } from "next/server";

import { ApiError, runTool } from "./booking-api";
import type { ToolName } from "./tools";
import { authenticateApiKey } from "./keys";

/** REST handler: Bearer key, JSON in, JSON out ({ ok, data } or { ok: false, error }). */
export async function handleRest(
  request: Request,
  tool: ToolName,
  input: (request: Request) => Promise<unknown>,
): Promise<NextResponse> {
  const auth = await authenticateApiKey(request);
  if (!auth)
    return NextResponse.json(
      { ok: false, error: { code: "unauthorized", message: "Chave de API inválida." } },
      { status: 401 },
    );
  try {
    const data = await runTool(auth, tool, await input(request).catch(() => null));
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    if (error instanceof ApiError)
      return NextResponse.json(
        { ok: false, error: { code: error.code, message: error.message } },
        { status: error.status },
      );
    console.error("api error", tool, error);
    return NextResponse.json(
      { ok: false, error: { code: "server_error", message: "Erro interno." } },
      { status: 500 },
    );
  }
}

export const jsonBody = (request: Request) => request.json() as Promise<unknown>;

export const queryInput = (request: Request) => {
  const params = new URL(request.url).searchParams;
  const input: Record<string, unknown> = {};
  for (const [key, value] of params) {
    if (key === "service_ids") input.service_ids = value.split(",").filter(Boolean);
    else input[key] = value;
  }
  return Promise.resolve(input);
};
