import { COMPANY, COMPANY_PLACE } from "./company";

/**
 * /sobre (2026-11-13): what MeetChat is, the problem it solves and who makes it. Facts only (no
 * user counts, reviews or prices); the company facts come from src/content/company.ts.
 */
export const ABOUT = {
  title: "Sobre o MeetChat: quem faz e para que serve",
  description: `O que é o MeetChat, o problema que ele resolve e quem faz: um produto da ${COMPANY.name}, de ${COMPANY_PLACE}.`,
  h1: "Sobre o MeetChat",
  sections: [
    {
      title: "Que problema o MeetChat resolve?",
      paragraphs: [
        "Quem trabalha com hora marcada passa boa parte do dia respondendo mensagens para combinar horário: qual serviço, que dia, que hora, se ainda tem vaga. Enquanto isso, o cliente espera a resposta e, às vezes, desiste ou marca com outro profissional. E quem marca e esquece deixa um buraco na agenda.",
        "O MeetChat tira essa conversa das suas mãos. Você divulga um link no Instagram, no WhatsApp, no Google ou no seu site, e o cliente marca sozinho, a qualquer hora, só nos horários que estão livres de verdade.",
      ],
    },
    {
      title: "Como funciona?",
      paragraphs: [
        "O link abre um chat de agendamento no navegador do celular, sem baixar aplicativo: o cliente escolhe o serviço, o profissional e um horário livre e confirma. O horário entra na sua agenda, e o cliente recebe a confirmação e o lembrete por e-mail.",
        "No painel ficam a agenda por profissional, os clientes e um financeiro simples. Se quiser, o chat pede um sinal pelo Pix, pago direto na sua chave: o MeetChat nunca recebe o dinheiro dos seus clientes.",
      ],
    },
    {
      title: "Para quem é?",
      paragraphs: [
        "Para negócios e profissionais que trabalham com hora marcada no Brasil: salões, barbearias, manicures, estúdios de cílios e de tatuagem, clínicas de estética, psicólogos, fisioterapeutas, nutricionistas, dentistas e outros consultórios, estúdios de pilates e yoga, personal trainers, pet shops e veterinários, professores particulares, fotógrafos, consultores, estética automotiva e quadras esportivas.",
      ],
    },
  ],
  company: {
    title: "Quem faz o MeetChat?",
    paragraphs: [
      `O MeetChat é um produto da ${COMPANY.name}, uma software house de ${COMPANY_PLACE} fundada em ${COMPANY.foundingYear} por ${COMPANY.founder.name}.`,
    ],
  },
} as const;
