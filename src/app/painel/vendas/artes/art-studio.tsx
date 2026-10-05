"use client";

import { Download, Share2 } from "lucide-react";
import { useState } from "react";

import { FieldShell } from "@/components/forms/field";
import { CopyTextButton } from "@/components/panel/copy-text-button";
import { Button } from "@/components/ui/button";

const TYPES = [
  { value: "agenda-aberta", label: "Agenda aberta" },
  { value: "horarios-hoje", label: "Horários livres hoje" },
  { value: "horarios-amanha", label: "Horários livres amanhã" },
  { value: "novo-servico", label: "Novo serviço" },
  { value: "oferta", label: "Oferta relâmpago (com cupom)" },
] as const;

const selectClass = "h-10 w-full rounded-lg border border-input bg-transparent px-2 text-sm";

export function ArtStudio({
  initialType,
  services,
  coupons,
  texts,
}: {
  initialType: string;
  services: { id: string; name: string }[];
  coupons: string[];
  /** Ready texts with the real free times, per art type (empty when nothing is free). */
  texts: Partial<Record<string, string>>;
}) {
  const [type, setType] = useState(
    TYPES.some((t) => t.value === initialType) ? initialType : "agenda-aberta",
  );
  const [service, setService] = useState(services[0]?.id ?? "");
  const [coupon, setCoupon] = useState(coupons[0] ?? "");
  const [error, setError] = useState<string | null>(null);

  const params = new URLSearchParams({ tipo: type });
  if (type === "novo-servico") params.set("servico", service);
  if (type === "oferta") params.set("cupom", coupon);
  const src = `/painel/vendas/artes/imagem?${params.toString()}`;

  async function share() {
    setError(null);
    try {
      const blob = await (await fetch(src)).blob();
      const file = new File([blob], `arte-${type}.png`, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] }))
        await navigator.share({ files: [file], title: TYPES.find((t) => t.value === type)?.label });
      else setError("Seu navegador não compartilha imagens. Use “Baixar”.");
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError("Não foi possível compartilhar.");
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_280px]">
      <div className="flex flex-col gap-4">
        <FieldShell name="art-type" label="Modelo">
          <select
            id="art-type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className={selectClass}
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </FieldShell>
        {type === "novo-servico" ? (
          <FieldShell name="art-service" label="Serviço">
            <select
              id="art-service"
              value={service}
              onChange={(e) => setService(e.target.value)}
              className={selectClass}
            >
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </FieldShell>
        ) : null}
        {type === "oferta" ? (
          coupons.length ? (
            <FieldShell name="art-coupon" label="Cupom">
              <select
                id="art-coupon"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                className={selectClass}
              >
                {coupons.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </FieldShell>
          ) : (
            <p className="text-sm text-muted-foreground">Crie um cupom ativo em Vendas → Cupons.</p>
          )
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <a href={src} download={`arte-${type}.png`}>
              <Download /> Baixar
            </a>
          </Button>
          <Button type="button" variant="outline" onClick={share}>
            <Share2 /> Compartilhar
          </Button>
        </div>
        {type in texts ? (
          texts[type] ? (
            <div className="flex flex-col gap-2 rounded-lg border bg-muted/50 p-3">
              <p className="text-sm font-medium">Texto para o status do WhatsApp</p>
              <p className="text-sm text-muted-foreground">{texts[type]}</p>
              <div>
                <CopyTextButton text={texts[type]} />
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Sem horários livres nesse dia. A arte convida a ver os próximos dias pelo link.
            </p>
          )
        ) : null}
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element -- generated preview */}
      <img
        key={src}
        src={src}
        alt="Prévia da arte"
        width={270}
        height={480}
        className="rounded-xl border shadow-sm"
      />
    </div>
  );
}
