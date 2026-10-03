import { Section } from "@/components/panel/page-header";
import { UpgradeNotice } from "@/components/panel/upgrade-notice";
import { brandUrl } from "@/brands/urls";
import { requireOwner } from "@/lib/business/context";
import { getPlanFeatures } from "@/lib/plans";

import { CodeBlock } from "./code-block";

/** Code and instructions to open the booking chat inside the owner's own site (Prompt 35). */
export async function EmbedSection() {
  const { business, brand } = await requireOwner();
  const features = getPlanFeatures(business);
  const base = brandUrl(brand, "/").split("?")[0]!.replace(/\/$/, "");
  const pageUrl = `${base}/${business.slug}`;
  const snippet = `<a href="${pageUrl}" data-lively-slug="${business.slug}">Agendar horário</a>\n<script src="${base}/embed.js" async></script>`;

  return (
    <Section
      title="Agendamento no seu site"
      description="O botão abre o chat de agendamento por cima do seu site. Sem o script, o link abre o chat numa nova página. Quem tem site também pode só colar o link do chat nos botões."
    >
      {!features.embed ? (
        <UpgradeNotice
          features={features}
          title="Agende dentro do seu site"
          description="Disponível no Pro e no Equipe."
        />
      ) : (
        <div className="flex flex-col gap-4 text-sm">
          <CodeBlock code={snippet} />
          <details className="rounded-lg border p-3">
            <summary className="cursor-pointer font-medium">Site próprio (HTML)</summary>
            <p className="mt-2 text-muted-foreground">
              Cole o código onde quer o botão. O script pode ficar uma vez só, antes de
              &lt;/body&gt;.
            </p>
          </details>
          <details className="rounded-lg border p-3">
            <summary className="cursor-pointer font-medium">WordPress</summary>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted-foreground">
              <li>
                Instale o plugin “Agendamento online” (pasta wordpress-plugin, enviada como .zip em
                Plugins → Adicionar novo → Enviar).
              </li>
              <li>
                Em Configurações → Agendamento online, informe o endereço {base} e o seu endereço “
                {business.slug}”.
              </li>
              <li>
                Use o atalho [agendamento texto=&quot;Agendar horário&quot;] em qualquer página.
              </li>
            </ol>
            <p className="mt-2 text-muted-foreground">
              Sem o plugin: adicione um bloco “HTML personalizado” com o código acima.
            </p>
          </details>
          <details className="rounded-lg border p-3">
            <summary className="cursor-pointer font-medium">Wix</summary>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted-foreground">
              <li>Adicionar → Incorporar código → HTML incorporado.</li>
              <li>Cole o código acima e ajuste o tamanho do bloco ao botão.</li>
            </ol>
          </details>
        </div>
      )}
    </Section>
  );
}
