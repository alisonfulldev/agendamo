"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploadButton } from "@/components/uploads/image-upload-button";
import type { WebTemplate } from "@/lib/db/types";

import { removeWebHeroAction, saveWebInfoAction, saveWebSiteAction } from "../actions";

export interface WebSiteValues {
  template: WebTemplate;
  primary_color: string | null;
  accent_color: string | null;
  hero_title: string;
  hero_subtitle: string;
  cta_label: string;
  whatsapp_message: string;
}

export interface WebInfoValues {
  name: string;
  bio: string;
  whatsapp: string;
  instagram: string;
  address: string;
  city: string;
}

/** The two templates of a site or of a store (names and a hint). */
export const WEB_TEMPLATE_INFO: Record<WebTemplate, { name: string; hint: string }> = {
  site_bold: { name: "Impacto", hint: "Foto grande no topo, cores fortes e títulos enormes" },
  site_clean: { name: "Clean", hint: "Claro, espaçoso e sofisticado" },
  store_showcase: { name: "Vitrine", hint: "Produtos em destaque, cores fortes" },
  store_clean: { name: "Boutique", hint: "Fundo claro, fotos grandes, estilo elegante" },
};

const fieldset = "flex flex-col gap-4 rounded-xl border bg-card p-5";

/**
 * "Meu site" of a "Site ou Loja" account (2026-11-07): template, colors, top photo and texts, the
 * WhatsApp message of the buttons and the business data, with the live site beside it.
 */
export function WebSiteEditor({
  templates,
  initial,
  info,
  defaults,
  heroUrl,
  previewPath,
}: {
  templates: WebTemplate[];
  initial: WebSiteValues;
  info: WebInfoValues;
  defaults: {
    primary: string;
    accent: string;
    title: string;
    subtitle: string;
    cta: string;
    message: string;
  };
  heroUrl: string | null;
  previewPath: string;
}) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [data, setData] = useState(info);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [previewKey, setPreviewKey] = useState(0);

  const set = <K extends keyof WebSiteValues>(key: K, value: WebSiteValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    setMessage(null);
  };
  const setInfo = <K extends keyof WebInfoValues>(key: K, value: string) => {
    setData((v) => ({ ...v, [key]: value }));
    setMessage(null);
  };

  const refreshPreview = () => {
    router.refresh();
    setPreviewKey((k) => k + 1);
  };

  const save = () =>
    startTransition(async () => {
      const [site, business] = await Promise.all([
        saveWebSiteAction(values),
        saveWebInfoAction(data),
      ]);
      const failed = !site.ok ? site : !business.ok ? business : null;
      setMessage(
        failed && !failed.ok
          ? { ok: false, text: failed.error }
          : { ok: true, text: "Site atualizado. Já está no ar." },
      );
      if (!failed) refreshPreview();
    });

  return (
    <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <fieldset className={fieldset}>
          <legend className="px-1 font-semibold">Modelo</legend>
          <div className="grid grid-cols-2 gap-3">
            {templates.map((key) => {
              const bold = key === "site_bold" || key === "store_showcase";
              return (
                <label
                  key={key}
                  className={`flex cursor-pointer flex-col gap-2 rounded-xl border p-3 ${values.template === key ? "ring-2 ring-primary" : ""}`}
                >
                  <input
                    type="radio"
                    name="template"
                    value={key}
                    checked={values.template === key}
                    onChange={() => set("template", key)}
                    className="sr-only"
                  />
                  <span
                    aria-hidden
                    className={`flex h-24 flex-col gap-1.5 overflow-hidden rounded-lg p-2 ${bold ? "bg-primary" : "border bg-background"}`}
                  >
                    <span
                      className={`h-4 w-3/4 rounded-sm ${bold ? "bg-primary-foreground/90" : "bg-foreground/80"}`}
                    />
                    <span
                      className={`h-2 w-1/2 rounded-sm ${bold ? "bg-primary-foreground/60" : "bg-foreground/30"}`}
                    />
                    <span
                      className={`mt-auto h-5 w-2/5 rounded-full ${bold ? "bg-primary-foreground" : "bg-primary"}`}
                    />
                  </span>
                  <span className="font-medium">{WEB_TEMPLATE_INFO[key].name}</span>
                  <span className="text-xs text-muted-foreground">
                    {WEB_TEMPLATE_INFO[key].hint}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <fieldset className={fieldset}>
          <legend className="px-1 font-semibold">Seu negócio</legend>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Nome do negócio</Label>
            <Input
              id="name"
              maxLength={80}
              value={data.name}
              onChange={(e) => setInfo("name", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="whatsapp">WhatsApp (para onde vão os clientes)</Label>
            <Input
              id="whatsapp"
              type="tel"
              inputMode="tel"
              maxLength={30}
              value={data.whatsapp}
              placeholder="(11) 99999-9999"
              onChange={(e) => setInfo("whatsapp", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bio">Sobre você ou sua empresa</Label>
            <Textarea
              id="bio"
              rows={5}
              maxLength={1000}
              value={data.bio}
              placeholder="Conte quem você é, há quanto tempo trabalha e o que faz de diferente."
              onChange={(e) => setInfo("bio", e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                maxLength={60}
                value={data.instagram}
                placeholder="@seuperfil"
                onChange={(e) => setInfo("instagram", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                maxLength={80}
                value={data.city}
                onChange={(e) => setInfo("city", e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="address">Endereço (opcional)</Label>
            <Input
              id="address"
              maxLength={200}
              value={data.address}
              placeholder="Rua, número e bairro"
              onChange={(e) => setInfo("address", e.target.value)}
            />
          </div>
        </fieldset>

        <fieldset className={fieldset}>
          <legend className="px-1 font-semibold">Cores</legend>
          {(
            [
              ["primary_color", "Cor principal", "Topo do site e botões", defaults.primary],
              ["accent_color", "Cor de destaque", "Detalhes e fundos claros", defaults.accent],
            ] as const
          ).map(([key, label, hint, fallback]) => (
            <div key={key} className="flex flex-wrap items-center gap-3">
              <input
                id={key}
                type="color"
                value={values[key] ?? fallback}
                onChange={(e) => set(key, e.target.value)}
                className="size-11 cursor-pointer rounded-lg border bg-transparent p-1"
              />
              <Label htmlFor={key} className="flex flex-col items-start gap-0.5">
                <span>{label}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {values[key] ? hint : `${hint} · automática`}
                </span>
              </Label>
              {values[key] ? (
                <Button type="button" variant="ghost" size="sm" onClick={() => set(key, null)}>
                  Voltar à automática
                </Button>
              ) : null}
            </div>
          ))}
        </fieldset>

        <fieldset className={fieldset}>
          <legend className="px-1 font-semibold">Foto do topo</legend>
          <p className="text-sm text-muted-foreground">
            A primeira coisa que quem visita vê. Use uma foto bonita do seu trabalho, da sua loja ou
            sua.
          </p>
          {heroUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- R2 public URL
            <img
              src={heroUrl}
              alt=""
              className="aspect-[4/3] w-56 rounded-xl border object-cover"
            />
          ) : null}
          <div className="flex flex-wrap gap-2">
            <ImageUploadButton kind="site_hero">
              {heroUrl ? "Trocar foto" : "Escolher foto"}
            </ImageUploadButton>
            {heroUrl ? (
              <Button
                type="button"
                variant="ghost"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await removeWebHeroAction();
                    refreshPreview();
                  })
                }
              >
                Remover
              </Button>
            ) : null}
          </div>
        </fieldset>

        <fieldset className={fieldset}>
          <legend className="px-1 font-semibold">Textos</legend>
          <p className="text-sm text-muted-foreground">
            Deixe em branco para usar o texto automático (aparece cinza no campo).
          </p>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="hero_title">Título do topo</Label>
            <Input
              id="hero_title"
              maxLength={90}
              value={values.hero_title}
              placeholder={defaults.title}
              onChange={(e) => set("hero_title", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="hero_subtitle">Subtítulo</Label>
            <Textarea
              id="hero_subtitle"
              maxLength={240}
              rows={3}
              value={values.hero_subtitle}
              placeholder={defaults.subtitle}
              onChange={(e) => set("hero_subtitle", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cta_label">Texto do botão</Label>
            <Input
              id="cta_label"
              maxLength={40}
              value={values.cta_label}
              placeholder={defaults.cta}
              onChange={(e) => set("cta_label", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="whatsapp_message">Mensagem que chega no seu WhatsApp</Label>
            <Textarea
              id="whatsapp_message"
              maxLength={300}
              rows={2}
              value={values.whatsapp_message}
              placeholder={defaults.message}
              onChange={(e) => set("whatsapp_message", e.target.value)}
            />
          </div>
        </fieldset>

        <div className="sticky bottom-24 z-10 flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3 shadow-lg md:bottom-4">
          <Button type="button" onClick={save} disabled={pending}>
            {pending ? "Salvando…" : "Salvar"}
          </Button>
          {message ? (
            <p
              role="status"
              className={`text-sm ${message.ok ? "text-primary" : "text-destructive"}`}
            >
              {message.text}
            </p>
          ) : null}
        </div>
      </div>

      <aside className="hidden xl:sticky xl:top-6 xl:block xl:w-[380px] xl:shrink-0">
        <div className="overflow-hidden rounded-[2rem] border-8 border-foreground shadow-xl">
          <iframe
            key={previewKey}
            src={previewPath}
            title="Prévia do site"
            className="h-[720px] w-full border-0"
          />
        </div>
      </aside>
    </div>
  );
}
