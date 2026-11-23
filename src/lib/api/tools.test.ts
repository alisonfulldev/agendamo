import { describe, expect, it } from "vitest";

import { isToolName, schemas, toolDefinitions } from "./tools";

describe("API da IA própria", () => {
  it("gera o JSON Schema de todas as ferramentas", () => {
    const tools = toolDefinitions();
    expect(tools.map((t) => t.name)).toEqual([
      "get_business_info",
      "list_available_days",
      "list_available_times",
      "create_appointment",
      "find_appointments",
      "cancel_appointment",
      "reschedule_appointment",
    ]);
    for (const tool of tools) {
      expect(tool.inputSchema.type).toBe("object");
      expect(tool.description.length).toBeGreaterThan(10);
    }
    const create = tools.find((t) => t.name === "create_appointment")!.inputSchema;
    expect(create.required).toEqual(
      expect.arrayContaining(["starts_at", "customer_name", "customer_phone"]),
    );
  });

  it("normaliza o telefone e recusa telefone inválido", () => {
    expect(schemas.find_appointments.parse({ customer_phone: "(11) 99999-8888" })).toEqual({
      customer_phone: "5511999998888",
    });
    expect(schemas.find_appointments.safeParse({ customer_phone: "123" }).success).toBe(false);
  });

  it("reconhece só ferramentas conhecidas", () => {
    expect(isToolName("create_appointment")).toBe(true);
    expect(isToolName("toString")).toBe(false);
  });
});
