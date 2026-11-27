/**
 * Who makes MeetChat (2026-11-13): BrandCode Solutions, a software house from Presidente
 * Prudente (SP), founded in 2022 by Alison Lima. One place for /sobre, the footer, /llms.txt,
 * the articles' author and the structured data (src/lib/seo/structured-data.ts).
 */
export const COMPANY = {
  name: "BrandCode Solutions",
  url: "https://brandcodesolutions.com.br/",
  aboutUrl: "https://brandcodesolutions.com.br/sobre",
  /** MeetChat in the company's portfolio. */
  portfolioUrl: "https://brandcodesolutions.com.br/portfolio#meetchat",
  city: "Presidente Prudente",
  state: "SP",
  foundingYear: "2022",
  founder: { name: "Alison Lima", url: "https://brandcodesolutions.com.br/sobre" },
  /** Logo shown on the company's own site (checked 2026-11-22). */
  logo: "https://brandcodesolutions.com.br/logo.png",
  /** The company's WhatsApp as shown on its site ((18) 99733-0574), in E.164. */
  whatsapp: "+5518997330574",
} as const;

/**
 * Official profiles of BrandCode Solutions (structured data `sameAs`). Only profiles that exist
 * and are linked from the company's site; add the others here when they are created/approved.
 */
export const COMPANY_PROFILES: readonly string[] = [
  "https://www.linkedin.com/company/122534364/",
  // TODO: Instagram da BrandCode, quando existir.
  // TODO: perfil no Crunchbase, quando for aprovado.
];

/** "Presidente Prudente/SP". */
export const COMPANY_PLACE = `${COMPANY.city}/${COMPANY.state}`;

/**
 * What MeetChat is, in two sentences (organization description, /sobre, /llms.txt). Facts only,
 * no prices: those come from src/lib/plans.ts where they appear.
 */
export const MEETCHAT_SUMMARY =
  "O MeetChat é um chat de agendamento online para negócios que trabalham com hora marcada no Brasil: o cliente toca no link (Instagram, WhatsApp, Google ou site), escolhe o serviço, o profissional e um horário livre e confirma, sem baixar aplicativo. Inclui agenda por profissional, confirmação automática e financeiro simples; no Premium, também sinal pelo Pix pago direto ao profissional e lembrete no celular do cliente.";
