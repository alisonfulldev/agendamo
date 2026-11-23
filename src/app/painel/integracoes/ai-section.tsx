import { formatInTimeZone } from "date-fns-tz";

import { ActionButton } from "@/components/panel/action-button";
import { Section } from "@/components/panel/page-header";
import { UpgradeNotice } from "@/components/panel/upgrade-notice";
import { brandUrl } from "@/brands/urls";
import { activeApiKey } from "@/lib/api/keys";
import { requireOwner } from "@/lib/business/context";
import { getPlanFeatures } from "@/lib/plans";

import { revokeApiKeyAction } from "./actions";
import { AiKeyGenerator } from "./ai-key";

/** The owner's own AI (e.g. Claude on WhatsApp) books in this agenda through MCP or the API. */
export async function AiSection() {
  const { business, brand } = await requireOwner();
  const features = getPlanFeatures(business);
  const base = brandUrl(brand, "/").split("?")[0]!.replace(/\/$/, "");
  const mcpUrl = `${base}/api/v1/mcp`;
  const key = features.agenda ? await activeApiKey(business.id) : null;
  const when = (iso: string) =>
    formatInTimeZone(new Date(iso), business.timezone, "dd/MM/yyyy HH:mm");

  return (
    <Section
      title="IA própria"
      description="Conecte a sua IA (por exemplo, o Claude que atende no seu WhatsApp) para ela consultar horários livres, agendar, remarcar e cancelar direto nesta agenda, com as mesmas regras do chat."
    >
      {!features.agenda ? (
        <UpgradeNotice
          features={features}
          title="Conecte a sua IA à agenda"
          description="Disponível no plano Completo."
        />
      ) : (
        <div className="flex flex-col gap-4 text-sm">
          {key ? (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3">
              <span>
                Chave ativa <code className="text-xs">{key.prefix}…</code> · criada em{" "}
                {when(key.createdAt)}
                {key.lastUsedAt ? ` · último uso ${when(key.lastUsedAt)}` : " · ainda não usada"}
              </span>
              <ActionButton
                size="sm"
                variant="ghost"
                confirmText="Desligar a chave? A IA para de agendar na hora."
                action={revokeApiKeyAction}
              >
                Desligar
              </ActionButton>
            </div>
          ) : null}
          <AiKeyGenerator hasKey={Boolean(key)} mcpUrl={mcpUrl} />
          <details className="rounded-lg border p-3">
            <summary className="cursor-pointer font-medium">Como conectar</summary>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted-foreground">
              <li>
                Gere a chave e guarde num lugar seguro (quem tem a chave agenda na sua agenda).
              </li>
              <li>
                Na sua IA, adicione o servidor MCP <code className="text-xs">{mcpUrl}</code> com a
                chave como token (cabeçalho Authorization: Bearer).
              </li>
              <li>
                A IA passa a ter as ferramentas: ver serviços, dias e horários livres, agendar,
                consultar, remarcar e cancelar agendamentos do cliente pelo WhatsApp dele.
              </li>
              <li>
                Os agendamentos aparecem na sua agenda como os do chat, com e-mail e aviso para
                você. Se você pede sinal pelo Pix, a IA recebe o Pix copia e cola para enviar.
              </li>
            </ol>
          </details>
        </div>
      )}
    </Section>
  );
}
