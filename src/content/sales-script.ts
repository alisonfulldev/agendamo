import type { BrandConfig } from "@/brands";
import { formatBRL } from "@/lib/money";
import { PLAN_PRICES, PRICE_TEXT, SITE_PRICE_TEXT } from "@/lib/plans";

/**
 * WhatsApp sales script (2026-11-06, Admin › Vendas): ready messages, copied one by one by the
 * seller, in the niche's words and with the example sites of the niche. Prices from plans.ts.
 */

export interface ScriptMessage {
  id: string;
  title: string;
  text: string;
}

/** Messages before the sale (1 to 4), for a niche. `origin`: absolute base of the links. */
export function salesScript(niche: BrandConfig, origin: string): ScriptMessage[] {
  const customer = niche.terms.customer.singular;
  const service = niche.terms.service.singular;
  const route = niche.niche?.route ?? "beleza";
  return [
    {
      id: "welcome",
      title: "1. Boas-vindas",
      text: `Oi! Que bom que você chamou 😊 Vou te mostrar como fica: seu site + agenda online, onde seu ${customer} marca sozinho, 24h, sem você precisar responder "tem horário?".`,
    },
    {
      id: "models",
      title: "2. Os dois modelos",
      text: `Tenho dois modelos de site. Toca e vê qual combina mais com você:\n\nModelo 1 (Vibrante): ${origin}/exemplo/${route}\nModelo 2 (Elegante): ${origin}/exemplo/${route}?modelo=elegante\n\nToca em "Agendar horário" para ver como seu ${customer} marca.`,
    },
    {
      id: "how",
      title: "3. Como funciona",
      text: `✅ Seu site no Google, com suas fotos, serviços e preços\n✅ ${capitalize(customer)} escolhe o ${service} e o horário livre e já fica marcado\n✅ Recebe confirmação e lembrete (menos faltas)\n✅ Você recebe aviso no celular a cada agendamento\n✅ Agenda, ${niche.terms.customer.plural}, financeiro e sinal pelo Pix\n\nTudo por ${SITE_PRICE_TEXT.monthly}, sem fidelidade. (Só a agenda, sem o site: ${PRICE_TEXT.monthly}.)

Quer seu próprio endereço, tipo seunegocio.com.br? Fica ${formatBRL(PLAN_PRICES.domainYearly)} por ano, registrado no seu nome.`,
    },
    {
      id: "closing",
      title: "4. Fechamento",
      text: "Quer que eu já deixe o seu pronto? Me passa:\n• nome do seu negócio\n• seu nome completo\n• e-mail\n• CPF (é para gerar o Pix)\n\nE qual modelo você preferiu, o 1 ou o 2?",
    },
  ];
}

/** Message 5: the Pix of the sale. */
export function pixMessage(input: {
  firstName: string;
  valueCents: number;
  payload: string;
  payUrl: string;
  termsUrl: string;
  /** Own domain in this first Pix (its first year). */
  domain?: { name: string; cents: number } | null;
}): string {
  const breakdown = input.domain
    ? ` (${formatBRL(input.valueCents - input.domain.cents)} da 1ª mensalidade + ${formatBRL(input.domain.cents)} do domínio ${input.domain.name}, 1º ano)`
    : "";
  return `Pronto, ${input.firstName}! Pix de ${formatBRL(input.valueCents)}${breakdown} (copia e cola):\n\n${input.payload}\n\nOu pelo link, com o QR code: ${input.payUrl}\n\nAssim que cair, sua conta é liberada e você recebe um e-mail com o acesso. Ao pagar, você concorda com os Termos de uso (${input.termsUrl}).`;
}

/** Message 6: after the payment. */
export function paidMessage(input: {
  firstName: string;
  siteUrl: string | null;
  chatUrl: string;
}): string {
  return `Pagamento confirmado! 🎉 ${input.siteUrl ? `Seu site já está no ar: ${input.siteUrl}\n` : ""}Seu link de agendamento: ${input.chatUrl}\n\nEntre no painel pelo e-mail que você recebeu (chega um código, sem senha) para colocar sua foto e ajustar serviços e preços. Qualquer dúvida, é só chamar aqui, ${input.firstName}.`;
}

/** WhatsApp link (wa.me, opened by the seller) with the message ready. */
export function whatsappLink(phone: string | null, text: string): string {
  const number = phone ? phone.replace(/\D/g, "") : "";
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
