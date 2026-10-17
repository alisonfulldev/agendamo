import { z } from "zod";

/**
 * SEO funnel events of the MeetChat site (Fase 9). Anonymous by design (rule 5): an id kept in
 * sessionStorage (gone when the tab closes), the page, its template and niche, and the session's
 * first page (landing). No cookies, no IP, no personal data.
 */
export const SITE_TEMPLATES = [
  "home",
  "nicho",
  "subpagina",
  "diretorio",
  "agendamento",
  "ferramenta",
  "comparar",
  "recursos",
  "ajuda",
  "precos",
  "outro",
] as const;
export type SiteTemplate = (typeof SITE_TEMPLATES)[number];

const path = z
  .string()
  .max(200)
  .regex(/^\/[a-z0-9/-]*$/);

export const siteEventSchema = z.object({
  type: z.enum(["page_view", "cta_click"]),
  path,
  template: z.enum(SITE_TEMPLATES),
  niche: z
    .string()
    .regex(/^[a-z][a-z0-9-]{0,39}$/)
    .nullable()
    .default(null),
  landing: path.nullable().default(null),
  sessionId: z.uuid(),
});

export type SiteEvent = z.infer<typeof siteEventSchema>;
