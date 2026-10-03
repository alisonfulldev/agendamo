import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader, Section } from "@/components/panel/page-header";
import { Button } from "@/components/ui/button";
import { requireOwner } from "@/lib/business/context";
import { getRadar } from "@/lib/portal/demand";
import { displayCount } from "@/lib/stats";

export const metadata: Metadata = { title: "Radar de demanda" };

export default async function RadarPage() {
  const { business } = await requireOwner();
  const radar = await getRadar(business);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Radar de demanda"
        description={
          radar.city
            ? `Procura no portal em ${radar.city} neste mês.`
            : "Informe sua cidade em Meu perfil para ver a procura na região."
        }
      />
      {radar.city ? (
        <>
          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border bg-card p-4">
              <dt className="text-sm text-muted-foreground">Vezes que seu negócio apareceu</dt>
              <dd className="font-heading text-3xl font-bold">{displayCount(radar.appearances)}</dd>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <dt className="text-sm text-muted-foreground">Cliques no seu negócio</dt>
              <dd className="font-heading text-3xl font-bold">{displayCount(radar.clicks)}</dd>
            </div>
          </dl>
          <Section title="Buscas pelos seus serviços">
            {radar.searches.length ? (
              <ul className="divide-y text-sm">
                {radar.searches.map((s) => (
                  <li key={s.service} className="flex justify-between py-2">
                    <span>{s.service}</span>
                    <span className="font-medium">{displayCount(s.count)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Ainda pouca procura registrada (mostramos a partir de 5).
              </p>
            )}
          </Section>
          <Section title="Horários de pico das buscas">
            {radar.peakHours.length ? (
              <p>{radar.peakHours.map((h) => `${String(h).padStart(2, "0")}h`).join(", ")}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Ainda sem dados suficientes.</p>
            )}
          </Section>
          <Section title={`Serviços mais procurados em ${radar.city}`}>
            {radar.nearby.length ? (
              <ol className="list-decimal space-y-1 pl-5 text-sm">
                {radar.nearby.map((s) => (
                  <li key={s.service}>
                    {s.service} · {displayCount(s.count)}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-muted-foreground">Ainda sem dados suficientes.</p>
            )}
          </Section>
          {!radar.featured ? (
            <Section
              title="Apareça primeiro"
              description="Com o Destaque no portal, seu negócio vem antes dos outros nas buscas da sua cidade."
            >
              <Button asChild>
                <Link href="/painel/plano">Contratar Destaque</Link>
              </Button>
            </Section>
          ) : null}
        </>
      ) : null}
      <p className="text-xs text-muted-foreground">
        Por privacidade, números abaixo de 5 não são exibidos.
      </p>
    </div>
  );
}
