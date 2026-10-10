import type { BrandConfig } from "@/brands";

/**
 * The booking played by the chat at the top of the home and of each niche page (about 5 s, once):
 * the customer picks the service and Saturday 10h, the booking is confirmed and the owner's
 * notification slides in. Niches without their own example use their first suggested service.
 */
export interface HeroDemo {
  /** Header: "Studio Lumi · Agendamento online". */
  business: string;
  subtitle: string;
  service: string;
  /** First name shown in the notification; null keeps it out (e.g. psychology). */
  customer: string | null;
}

/** Generic home (/). */
export const HOME_DEMO: HeroDemo = {
  business: "Studio Lumi",
  subtitle: "Agendamento online",
  service: "Design de sobrancelha",
  customer: "Ana",
};

/** Own examples per niche (brand key). */
const NICHE_DEMOS: Record<string, HeroDemo> = {
  barber: {
    business: "Barbearia do Zé",
    subtitle: "Agendamento online",
    service: "Corte + barba",
    customer: "Rafael",
  },
  "lash-brow": HOME_DEMO,
  nails: {
    business: "Esmalteria Bella",
    subtitle: "Agendamento online",
    service: "Pé e mão",
    customer: "Ana",
  },
  aesthetics: {
    business: "Clínica Lis",
    subtitle: "Agendamento online",
    service: "Limpeza de pele",
    customer: "Ana",
  },
  psychology: {
    business: "Ana Souza",
    subtitle: "Psicóloga",
    service: "Sessão online",
    customer: null,
  },
};

export function heroDemoFor(brand: BrandConfig): HeroDemo {
  return (
    NICHE_DEMOS[brand.key] ?? {
      business: brand.sales.demo.businessName,
      subtitle: "Agendamento online",
      service: brand.suggestedServices[0]?.name ?? "Atendimento",
      customer: brand.sales.demo.customerName.split(" ")[0] ?? null,
    }
  );
}

export const HERO_CHAT_TEXT = {
  greeting: "Olá! Você está na agenda de {business}. Qual atendimento você quer?",
  askDay: "Qual dia fica melhor?",
  confirmed: "Pronto! Horário confirmado. ✅",
  /** "Novo agendamento: Ana, sábado 10h" / "Novo agendamento: sessão sábado 10h". */
  notification: (demo: HeroDemo) =>
    demo.customer
      ? `Novo agendamento: ${demo.customer}, sábado 10h`
      : `Novo agendamento: ${demo.service.split(" ")[0]!.toLowerCase()} sábado 10h`,
  ask: "Quer um desse para o seu negócio? É grátis. Qual o nome dele?",
  placeholder: "Ex.: Studio Bella",
  collapse: "Recolher",
  send: "Enviar",
};
