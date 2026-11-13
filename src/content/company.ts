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
} as const;

/** "Presidente Prudente/SP". */
export const COMPANY_PLACE = `${COMPANY.city}/${COMPANY.state}`;

/**
 * What MeetChat is, in two sentences (organization description, /sobre, /llms.txt). Facts only,
 * no prices: those come from src/lib/plans.ts where they appear.
 */
export const MEETCHAT_SUMMARY =
  "O MeetChat é um chat de agendamento online para negócios que trabalham com hora marcada no Brasil: o cliente toca no link (Instagram, WhatsApp, Google ou site), escolhe o serviço, o profissional e um horário livre e confirma, sem baixar aplicativo. Inclui agenda por profissional, confirmação e lembrete por e-mail, sinal pelo Pix pago direto ao profissional e financeiro simples.";
