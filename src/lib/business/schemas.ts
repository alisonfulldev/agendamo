import { z } from "zod";

import { SEGMENTS } from "@/brands/schema";
import { normalizeBrPhone } from "@/lib/phone";
import { isValidSlugFormat } from "@/lib/slug";
import { normalizeInstagram } from "@/lib/social";

// Shared between browser (step validation) and server (authoritative validation).

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : null));

export const timeOfDay = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$|^24:00$/, "Horário inválido");

export const workingRangeSchema = z
  .object({ weekday: z.number().int().min(0).max(6), start: timeOfDay, end: timeOfDay })
  .refine((r) => r.end > r.start, { message: "O fim precisa ser depois do início", path: ["end"] });

/** Ranges of the same weekday must not overlap. */
export const weeklyHoursSchema = z.array(workingRangeSchema).superRefine((ranges, ctx) => {
  for (const day of [0, 1, 2, 3, 4, 5, 6]) {
    const sorted = ranges
      .filter((r) => r.weekday === day)
      .sort((a, b) => a.start.localeCompare(b.start));
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i]!.start < sorted[i - 1]!.end) {
        ctx.addIssue({ code: "custom", message: "Há faixas de horário sobrepostas no mesmo dia" });
        return;
      }
    }
  }
});

export const serviceDraftSchema = z.object({
  name: z.string().trim().min(1, "Dê um nome ao serviço").max(100),
  durationMinutes: z.number().int().min(5).max(720).multipleOf(5, "Use múltiplos de 5 minutos"),
  priceCents: z.number().int().min(0).max(10_000_000),
});

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .refine(isValidSlugFormat, "Use de 3 a 40 letras minúsculas, números e hífens");

export const onboardingSchema = z.object({
  segment: z.enum(SEGMENTS),
  name: z.string().trim().min(2, "Informe o nome do negócio").max(120),
  slug: slugSchema,
  whatsapp: z
    .string()
    .optional()
    .transform((v, ctx) => {
      if (!v || !v.replace(/\D/g, "")) return null;
      const phone = normalizeBrPhone(v);
      if (!phone) {
        ctx.addIssue({ code: "custom", message: "WhatsApp inválido. Use DDD + número." });
        return z.NEVER;
      }
      return phone;
    }),
  instagram: z
    .string()
    .optional()
    .transform((v, ctx) => {
      if (!v?.trim()) return null;
      const url = normalizeInstagram(v);
      if (!url) {
        ctx.addIssue({ code: "custom", message: "Instagram inválido. Use @seuperfil." });
        return z.NEVER;
      }
      return url;
    }),
  address: optionalText(200),
  city: optionalText(80),
  neighborhood: optionalText(80),
  services: z.array(serviceDraftSchema).min(1, "Cadastre pelo menos 1 serviço").max(30),
  hours: weeklyHoursSchema,
});

export type OnboardingInput = z.input<typeof onboardingSchema>;
export type OnboardingData = z.output<typeof onboardingSchema>;

/** Default week: Monday–Friday 09–12 and 13–18, Saturday 09–13. */
export const DEFAULT_HOURS: { weekday: number; start: string; end: string }[] = [
  ...[1, 2, 3, 4, 5].flatMap((weekday) => [
    { weekday, start: "09:00", end: "12:00" },
    { weekday, start: "13:00", end: "18:00" },
  ]),
  { weekday: 6, start: "09:00", end: "13:00" },
];
