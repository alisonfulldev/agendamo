import type { Metadata } from "next";
import Link from "next/link";

import { NICHES, PLATFORM } from "@/brands";
import { brandThemeStyle } from "@/brands/theme";
import { siteUrl } from "@/lib/site-url";

/**
 * Presentation of MeetChat for WhatsApp leads (2026-11-06): the slides of docs/marketing (system,
 * modules, benefits, price) as a link the seller sends in the chat. Out of search engines and not
 * linked from the site. With ?ramo=<route> it also shows that niche's example sites.
 */

const SLIDES = [
  "MeetChat: seu site + agenda online. Seus clientes marcam sozinhos, 24 horas. Você só atende.",
  "Como funciona: 1. você divulga seu link na bio do Instagram, no WhatsApp e no Google; 2. o cliente escolhe serviço, dia e um horário livre; 3. pronto, ele recebe a confirmação e você um aviso no celular. Sem baixar aplicativo e sem criar conta.",
  "Tudo que vem no plano: site pronto para o Google, agendamento por chat 24h, lembretes automáticos, aviso no seu celular, agenda e equipe, clientes, financeiro simples e sinal pelo Pix.",
  "Ferramentas para vender mais: cupons de desconto, pacotes de sessões, lista de espera, clientes que sumiram, indicações, avaliações, artes para stories e Google Agenda.",
  "O que muda no seu dia: chega de responder “tem horário?”, agenda cheia até quando você está dormindo, menos faltas com lembrete e sinal pelo Pix, seu negócio no Google com um site seu e imagem profissional.",
  "Site + Agenda por R$ 49 por mês, sem taxa de criação e sem fidelidade. Opcionais: seu próprio endereço .com.br e site personalizado.",
];

export const metadata: Metadata = {
  title: "MeetChat: site + agenda online",
  description:
    "Seus clientes marcam sozinhos, 24 horas. Veja como funciona, o que vem no plano e o preço.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "MeetChat: site + agenda online",
    description: "Seus clientes marcam sozinhos, 24 horas. Veja como funciona e o preço.",
    images: [{ url: siteUrl("/apresentacao/capa.jpg"), width: 1080, height: 1350 }],
    type: "website",
  },
};

export default async function PresentationPage({ searchParams }: PageProps<"/apresentacao">) {
  const { ramo } = await searchParams;
  const niche = typeof ramo === "string" ? NICHES.find((b) => b.niche!.route === ramo) : undefined;

  return (
    <div
      data-theme-scope=""
      style={brandThemeStyle(PLATFORM)}
      className="lp-deep min-h-[100dvh] px-4 py-6 font-sans"
    >
      <main className="mx-auto flex max-w-[540px] flex-col gap-4">
        <h1 className="sr-only">MeetChat: site + agenda online</h1>
        {SLIDES.map((alt, i) => (
          // eslint-disable-next-line @next/next/no-img-element -- static slides
          <img
            key={alt}
            src={`/apresentacao/0${i + 1}.webp`}
            alt={alt}
            width={1080}
            height={1350}
            loading={i === 0 ? "eager" : "lazy"}
            className="w-full rounded-2xl shadow-lg"
          />
        ))}

        {niche ? (
          <section className="lp-lime flex flex-col gap-3 rounded-2xl p-6 text-center">
            <h2 className="lp-title text-3xl">
              Veja os modelos para {niche.niche!.name.toLowerCase()}
            </h2>
            <p className="text-pretty">
              Toque, veja o site e teste o agendamento como seu cliente.
            </p>
            <Link
              href={`/exemplo/${niche.niche!.route}`}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[color:var(--lp-cta-bg)] px-6 font-bold text-[color:var(--lp-cta-fg)]"
            >
              Modelo 1: Vibrante
            </Link>
            <Link
              href={`/exemplo/${niche.niche!.route}?modelo=elegante`}
              className="inline-flex min-h-12 items-center justify-center rounded-full border-2 border-current px-6 font-bold"
            >
              Modelo 2: Elegante
            </Link>
          </section>
        ) : null}

        <p className="lp-title px-2 py-6 text-center text-3xl text-balance text-[color:var(--lp-heading)]">
          Gostou? Responda a conversa no WhatsApp e eu deixo o seu pronto hoje.
        </p>
      </main>
    </div>
  );
}
