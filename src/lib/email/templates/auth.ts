import type { BrandConfig } from "@/brands";

import type { EmailContent } from "../layout";

export function confirmSignupEmail(
  brand: BrandConfig,
  url: string,
): { subject: string; content: EmailContent } {
  return {
    subject: `Confirme seu e-mail no ${brand.name}`,
    content: {
      preheader: "Falta só um clique para criar sua página.",
      heading: "Confirme seu e-mail",
      paragraphs: [
        `Que bom ter você no ${brand.name}! Confirme seu e-mail para começar a montar sua página.`,
      ],
      cta: { label: "Confirmar e-mail", url },
      footnote: "Se você não criou uma conta, é só ignorar este e-mail. O link vale por 24 horas.",
    },
  };
}

export function existingAccountEmail(
  brand: BrandConfig,
  signInUrl: string,
  resetUrl: string,
): { subject: string; content: EmailContent } {
  return {
    subject: `Você já tem conta no ${brand.name}`,
    content: {
      heading: "Você já tem uma conta",
      paragraphs: [
        "Alguém tentou criar uma conta com este e-mail, mas ela já existe. Você pode entrar normalmente.",
      ],
      cta: { label: "Entrar", url: signInUrl },
      secondaryLinks: [{ label: "Esqueci minha senha", url: resetUrl }],
      footnote: "Se não foi você, ignore este e-mail. Sua conta continua segura.",
    },
  };
}

export function resetPasswordEmail(
  brand: BrandConfig,
  url: string,
): { subject: string; content: EmailContent } {
  return {
    subject: `Redefinir sua senha do ${brand.name}`,
    content: {
      heading: "Redefinir senha",
      paragraphs: [
        "Recebemos um pedido para redefinir sua senha. Clique no botão para escolher uma nova.",
      ],
      cta: { label: "Escolher nova senha", url },
      footnote: "Se você não pediu, ignore este e-mail. O link vale por 1 hora.",
    },
  };
}
