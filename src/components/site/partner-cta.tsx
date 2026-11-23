import Link from "next/link";

import { INCOME_GOAL_NOTE, PARTNER_NUMBERS as N } from "@/content/partners";

/** Call to the partner program at the end of the income pages (/renda-extra). */
export function PartnerCta() {
  return (
    <aside className="lp-invert mt-14 flex flex-col items-start gap-4 rounded-[2rem] px-6 py-10 sm:px-10 sm:py-12">
      <p className="lp-display font-heading text-3xl leading-tight font-semibold text-balance">
        Fature até {N.goal} por mês indicando o MeetChat.
      </p>
      <p className="text-pretty">
        {N.first} no 1º pagamento de cada negócio e {N.recurring} todo mês depois, no plano{" "}
        {N.planName}. Cadastro grátis, link na hora, pagamento por Pix.
      </p>
      <Link
        href="/parceiros/cadastro"
        className="lp-press inline-flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-background px-5 py-3 text-center font-semibold text-[color:var(--brand-text)] shadow-lg sm:w-auto"
      >
        Quero ser parceiro
      </Link>
      <p className="text-sm text-muted-foreground">
        É possível chegar a {INCOME_GOAL_NOTE}. Não é promessa de ganho.{" "}
        <Link href="/parceiros" className="underline">
          Ver regras e simulação
        </Link>
      </p>
    </aside>
  );
}
