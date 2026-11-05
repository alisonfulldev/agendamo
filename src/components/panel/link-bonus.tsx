import { CheckCircle2, Gift } from "lucide-react";

import { CopyTextButton } from "@/components/panel/copy-text-button";
import { LINK_BONUS_DAYS, LINK_BONUS_PARAM, type LinkBonus } from "@/lib/trial-bonus-shared";

/**
 * "Ganhe +14 dias" on Início during the trial (2026-11-05): a link for the Instagram bio and a
 * ready greeting for WhatsApp Business. Each one adds 7 days when the first customer comes through
 * it (granted by /api/events).
 */
export function LinkBonusCard({
  pageUrl,
  businessName,
  earned,
}: {
  pageUrl: string;
  businessName: string;
  earned: Set<LinkBonus>;
}) {
  const bioUrl = `${pageUrl}?${LINK_BONUS_PARAM}=bio`;
  const greeting = `Olá! Que bom falar com você 😊 Para agendar com ${businessName}, escolha o serviço e um horário livre aqui: ${pageUrl}?${LINK_BONUS_PARAM}=saudacao`;
  const steps: {
    key: LinkBonus;
    title: string;
    how: string;
    copy: string;
    label: string;
  }[] = [
    {
      key: "bio",
      title: "Link na bio do Instagram",
      how: "No Instagram: Editar perfil › Links › Adicionar link externo. Cole este link:",
      copy: bioUrl,
      label: "Copiar link da bio",
    },
    {
      key: "saudacao",
      title: "Link na saudação do WhatsApp",
      how: "No WhatsApp Business: Ferramentas comerciais › Mensagem de saudação › ative e cole este texto:",
      copy: greeting,
      label: "Copiar saudação",
    },
  ];
  const done = steps.filter((s) => earned.has(s.key)).length;

  return (
    <section
      aria-labelledby="bonus"
      className="flex flex-col gap-4 rounded-xl border border-primary/30 bg-card p-5"
    >
      <div className="flex items-start gap-3">
        <Gift className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
        <div>
          <h2 id="bonus" className="font-semibold">
            Ganhe até +{LINK_BONUS_DAYS * steps.length} dias de teste
          </h2>
          <p className="text-sm text-muted-foreground">
            Coloque seu link onde os clientes já estão. Quando o primeiro cliente chegar por cada
            link, seu teste ganha +{LINK_BONUS_DAYS} dias.{" "}
            {done ? `Você já ganhou ${done * LINK_BONUS_DAYS} dias.` : ""}
          </p>
        </div>
      </div>
      <ol className="flex flex-col gap-3">
        {steps.map((step) => (
          <li key={step.key} className="rounded-lg border bg-background p-4">
            <p className="flex items-center gap-2 font-medium">
              {earned.has(step.key) ? (
                <CheckCircle2 className="size-4 text-primary" aria-hidden />
              ) : null}
              {step.title}
              {earned.has(step.key) ? (
                <span className="text-sm font-normal text-muted-foreground">
                  · +{LINK_BONUS_DAYS} dias ganhos
                </span>
              ) : (
                <span className="text-sm font-normal text-muted-foreground">
                  · +{LINK_BONUS_DAYS} dias
                </span>
              )}
            </p>
            {earned.has(step.key) ? null : (
              <>
                <p className="mt-1 text-sm text-muted-foreground">{step.how}</p>
                <p className="my-2 rounded-md bg-muted px-3 py-2 text-sm break-words">
                  {step.copy}
                </p>
                <CopyTextButton text={step.copy} label={step.label} />
              </>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
