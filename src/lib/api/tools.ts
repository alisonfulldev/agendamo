import { z } from "zod";

import { normalizeBrPhone } from "@/lib/phone";

/** Tools of the owner's own AI (MCP / REST): input schemas (rule 9) and descriptions. */

const phoneSchema = z.string().transform((v, ctx) => {
  const phone = normalizeBrPhone(v);
  if (!phone) {
    ctx.addIssue({ code: "custom", message: "Telefone inválido (use DDD + número)." });
    return z.NEVER;
  }
  return phone;
});

const selectionFields = {
  service_ids: z
    .array(z.uuid())
    .max(6)
    .default([])
    .describe("IDs dos serviços (de get_business_info), na ordem do atendimento."),
  combo_id: z.uuid().nullish().describe("ID de um combo, no lugar de service_ids."),
  professional_id: z
    .uuid()
    .nullish()
    .describe("ID do profissional. Omitir = qualquer profissional disponível."),
};

export const schemas = {
  get_business_info: z.object({}),
  list_available_days: z.object({
    ...selectionFields,
    from_date: z.iso.date().nullish().describe("Primeiro dia (AAAA-MM-DD). Omitir = hoje."),
  }),
  list_available_times: z.object({
    ...selectionFields,
    date: z.iso.date().describe("Dia no fuso do negócio (AAAA-MM-DD)."),
  }),
  create_appointment: z.object({
    ...selectionFields,
    starts_at: z.iso
      .datetime({ offset: true })
      .describe("Valor starts_at exato retornado por list_available_times."),
    customer_name: z.string().trim().min(2).max(120).describe("Nome completo do cliente."),
    customer_phone: phoneSchema.describe("WhatsApp do cliente com DDD (ex.: 5511999998888)."),
    customer_email: z
      .email()
      .max(200)
      .nullish()
      .describe("E-mail do cliente (opcional; recebe confirmação e lembrete)."),
    deposit_policy_accepted: z
      .boolean()
      .default(false)
      .describe(
        "true só depois que o cliente leu e aceitou a política do sinal (quando o negócio pede sinal pelo Pix).",
      ),
  }),
  find_appointments: z.object({
    customer_phone: phoneSchema.describe("WhatsApp do cliente com DDD."),
  }),
  cancel_appointment: z.object({
    appointment_id: z.uuid().describe("ID do agendamento (de find_appointments)."),
    customer_phone: phoneSchema.describe("WhatsApp do cliente dono do agendamento."),
  }),
  reschedule_appointment: z.object({
    appointment_id: z.uuid().describe("ID do agendamento (de find_appointments)."),
    customer_phone: phoneSchema.describe("WhatsApp do cliente dono do agendamento."),
    new_starts_at: z.iso
      .datetime({ offset: true })
      .describe("Novo starts_at, retornado por list_available_times para os mesmos serviços."),
  }),
};

export type ToolName = keyof typeof schemas;

export const TOOL_DESCRIPTIONS: Record<ToolName, string> = {
  get_business_info:
    "Dados do negócio: nome, fuso, data e hora atuais, serviços (id, duração, preço), combos, profissionais e regra de sinal pelo Pix. Chame primeiro.",
  list_available_days: "Próximos dias (até 14) com horário livre para os serviços escolhidos.",
  list_available_times:
    "Horários livres num dia para os serviços escolhidos. Ofereça só estes horários.",
  create_appointment:
    "Agenda o cliente num horário retornado por list_available_times. Confirme serviço, dia, hora e nome com o cliente antes. Se voltar status awaiting_deposit, envie o Pix copia e cola e o link para ele avisar que pagou.",
  find_appointments: "Próximos agendamentos ativos do cliente, pelo WhatsApp dele.",
  cancel_appointment:
    "Cancela um agendamento do cliente. Confirme com o cliente antes de cancelar.",
  reschedule_appointment:
    "Remarca um agendamento do cliente para outro horário livre dos mesmos serviços.",
};

export function isToolName(name: string): name is ToolName {
  return Object.hasOwn(schemas, name);
}

/** JSON Schema of each tool's input (MCP tools/list). */
export function toolDefinitions() {
  return (Object.keys(schemas) as ToolName[]).map((name) => ({
    name,
    description: TOOL_DESCRIPTIONS[name],
    inputSchema: z.toJSONSchema(schemas[name], { io: "input" }),
  }));
}
