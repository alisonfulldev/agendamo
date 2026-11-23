import { NextResponse } from "next/server";

import { ApiError, runTool } from "@/lib/api/booking-api";
import { authenticateApiKey } from "@/lib/api/keys";
import { isToolName, toolDefinitions } from "@/lib/api/tools";

/**
 * MCP server (Streamable HTTP, stateless, JSON responses) for the owner's own AI: Claude (MCP
 * connector of the Messages API, Claude Desktop/Code, agents) connects with the key from
 * Painel › Integrações as a Bearer token. Same operations as the REST API in /api/v1.
 */

export const dynamic = "force-dynamic";

const SUPPORTED_VERSIONS = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"];

const INSTRUCTIONS =
  "Agenda do negócio no MeetChat. Fluxo: get_business_info → list_available_days → list_available_times → confirmar com o cliente → create_appointment. Ofereça só horários retornados pelas ferramentas; datas e horas estão no fuso do negócio. Para remarcar ou cancelar, use find_appointments com o WhatsApp do cliente.";

interface RpcRequest {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

const rpcResult = (id: RpcRequest["id"], result: unknown) =>
  NextResponse.json({ jsonrpc: "2.0", id, result });

const rpcError = (id: RpcRequest["id"] | null, code: number, message: string, status = 200) =>
  NextResponse.json({ jsonrpc: "2.0", id: id ?? null, error: { code, message } }, { status });

export async function POST(request: Request) {
  const auth = await authenticateApiKey(request);
  if (!auth) return rpcError(null, -32001, "Chave de API inválida.", 401);

  let message: RpcRequest;
  try {
    message = (await request.json()) as RpcRequest;
  } catch {
    return rpcError(null, -32700, "Parse error", 400);
  }
  if (!message || typeof message !== "object" || Array.isArray(message) || !message.method)
    return rpcError(null, -32600, "Invalid request", 400);

  // Notifications (no id) and responses get 202 with no body.
  if (message.id === undefined) return new NextResponse(null, { status: 202 });

  const { id, method, params } = message;
  switch (method) {
    case "initialize": {
      const requested = params?.protocolVersion as string | undefined;
      return rpcResult(id, {
        protocolVersion:
          requested && SUPPORTED_VERSIONS.includes(requested) ? requested : SUPPORTED_VERSIONS[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "meetchat", version: "1.0.0" },
        instructions: INSTRUCTIONS,
      });
    }
    case "ping":
      return rpcResult(id, {});
    case "tools/list":
      return rpcResult(id, { tools: toolDefinitions() });
    case "tools/call": {
      const name = params?.name;
      if (typeof name !== "string" || !isToolName(name))
        return rpcError(id, -32602, `Ferramenta desconhecida: ${String(name)}`);
      try {
        const data = await runTool(auth, name, params?.arguments);
        return rpcResult(id, {
          content: [{ type: "text", text: JSON.stringify(data) }],
          structuredContent: data,
          isError: false,
        });
      } catch (error) {
        if (!(error instanceof ApiError)) console.error("mcp tool error", name, error);
        const text =
          error instanceof ApiError
            ? JSON.stringify({ error: error.code, message: error.message })
            : JSON.stringify({ error: "server_error", message: "Erro interno. Tente de novo." });
        return rpcResult(id, { content: [{ type: "text", text }], isError: true });
      }
    }
    default:
      return rpcError(id, -32601, `Method not found: ${method}`);
  }
}

/** No server-initiated stream (stateless server). */
export function GET() {
  return new NextResponse(null, { status: 405, headers: { Allow: "POST" } });
}

export function DELETE() {
  return new NextResponse(null, { status: 405, headers: { Allow: "POST" } });
}
