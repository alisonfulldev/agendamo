"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploadButton } from "@/components/uploads/image-upload-button";
import type { SiteTemplate } from "@/lib/db/types";

import { removeSiteHeroAction, saveSiteAction } from "./actions";

export interface SiteEditorValues {
  template: SiteTemplate;
  primary_color: string | null;
  accent_color: string | null;
  hero_title: string;
  hero_subtitle: string;
  cta_label: string;
  sections: { key: string; label: string; hint?: string; visible: boolean }[];
}

const TEMPLATES: { key: SiteTemplate; name: string; hint: string }[] = [
  { key: "vibrant", name: "Vibrante", hint: "Blocos de cor e títulos grandes" },
  { key: "elegant", name: "Elegante", hint: "Fundo claro, foto grande e títulos finos" },
];

/** "Meu site": template, colors, top photo, texts and sections, with the live site beside it. */
export function SiteEditor({
  initial,
  defaults,
  heroUrl,
  previewPath,
}: {
  initial: SiteEditorValues;
  /** What the site shows when a field is left empty. */
  defaults: { primary: string; accent: string; title: string; subtitle: string; cta: string };
  /** The site's own top photo (null: it uses the cover or the profile photo). */
  heroUrl: string | null;
  previewPath: string;
}) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [previewKey, setPreviewKey] = useState(0);

  const set = <K extends keyof SiteEditorValues>(key: K, value: SiteEditorValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    setMessage(null);
  };

  const move = (index: number, delta: number) => {
    const next = [...values.sections];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item!);
    set("sections", next);
  };

  const save = () =>
    startTransition(async () => {
      const result = await saveSiteAction({
        template: values.template,
        primary_color: values.primary_color,
        accent_color: values.accent_color,
        hero_title: values.hero_title,
        hero_subtitle: values.hero_subtitle,
        cta_label: values.cta_label,
        sections: values.sections.map(({ key, visible }) => ({ key, visible })),
      });
      setMessage(
        result.ok
          ? { ok: true, text: "Site atualizado. Já está no ar." }
          : { ok: false, text: result.error },
      );
      if (result.ok) {
        router.refresh();
        setPreviewKey((k) => k + 1);
      }
    });

  const refreshPreview = () => {
    router.refresh();
    setPreviewKey((k) => k + 1);
  };

  return (
    <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <fieldset className="flex flex-col gap-3 rounded-xl border bg-card p-5">
          <legend className="px-1 font-semibold">Modelo</legend>
          <div className="grid grid-cols-2 gap-3">
            {TEMPLATES.map((t) => (
              <label
                key={t.key}
                className={`flex cursor-pointer flex-col gap-2 rounded-xl border p-3 ${values.template === t.key ? "ring-2 ring-primary" : ""}`}
              >
                <input
                  type="radio"
                  name="template"
                  value={t.key}
                  checked={values.template === t.key}
                  onChange={() => set("template", t.key)}
                  className="sr-only"
                />
                <span
                  aria-hidden
                  className={`flex h-24 flex-col gap-1.5 overflow-hidden rounded-lg p-2 ${t.key === "vibrant" ? "bg-primary" : "border bg-background"}`}
                >
                  <span
                    className={`h-3 w-2/3 rounded-sm ${t.key === "vibrant" ? "bg-primary-foreground/90" : "bg-foreground/80"}`}
                  />
                  <span
                    className={`h-2 w-1/2 rounded-sm ${t.key === "vibrant" ? "bg-primary-foreground/60" : "bg-foreground/30"}`}
                  />
                  <span
                    className={`mt-auto h-4 w-1/3 rounded-full ${t.key === "vibrant" ? "bg-primary-foreground" : "bg-primary"}`}
                  />
                </span>
                <span className="font-medium">{t.name}</span>
                <span className="text-xs text-muted-foreground">{t.hint}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-4 rounded-xl border bg-card p-5">
          <legend className="px-1 font-semibold">Cores</legend>
          {(
            [
              ["primary_color", "Cor principal", "Topo do site e botões", defaults.primary],
              ["accent_color", "Cor de destaque", "Blocos claros e detalhes", defaults.accent],
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

        <fieldset className="flex flex-col gap-3 rounded-xl border bg-card p-5">
          <legend className="px-1 font-semibold">Foto do topo</legend>
          <p className="text-sm text-muted-foreground">
            A primeira coisa que a cliente vê. Sem foto aqui, o site usa a capa ou a foto do perfil.
            De pé (vertical) fica melhor.
          </p>
          {heroUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- R2 public URL
            <img
              src={heroUrl}
              alt=""
              className="aspect-[4/5] w-40 rounded-xl border object-cover"
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
                    await removeSiteHeroAction();
                    refreshPreview();
                  })
                }
              >
                Remover
              </Button>
            ) : null}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-4 rounded-xl border bg-card p-5">
          <legend className="px-1 font-semibold">Textos do topo</legend>
          <p className="text-sm text-muted-foreground">
            Deixe em branco para usar o texto automático (aparece cinza no campo).
          </p>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="hero_title">Título</Label>
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
        </fieldset>

        <fieldset className="flex flex-col gap-2 rounded-xl border bg-card p-5">
          <legend className="px-1 font-semibold">Seções</legend>
          <p className="mb-1 text-sm text-muted-foreground">
            Escolha o que aparece e em que ordem. Seções sem conteúdo (por exemplo, sem fotos) não
            aparecem.
          </p>
          <ul className="flex flex-col gap-2">
            {values.sections.map((section, i) => (
              <li
                key={section.key}
                className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2"
              >
                <label className="flex min-h-11 flex-1 cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={section.visible}
                    onChange={(e) =>
                      set(
                        "sections",
                        values.sections.map((s) =>
                          s.key === section.key ? { ...s, visible: e.target.checked } : s,
                        ),
                      )
                    }
                    className="size-5 accent-[var(--primary)]"
                  />
                  <span className={section.visible ? "" : "text-muted-foreground line-through"}>
                    {section.label}
                  </span>
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Subir ${section.label}`}
                  disabled={i === 0}
                  onClick={() => move(i, -1)}
                >
                  <ArrowUp />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Descer ${section.label}`}
                  disabled={i === values.sections.length - 1}
                  onClick={() => move(i, 1)}
                >
                  <ArrowDown />
                </Button>
              </li>
            ))}
          </ul>
        </fieldset>

        <div className="sticky bottom-20 z-10 flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3 shadow-lg md:bottom-4">
          <Button type="button" size="lg" disabled={pending} onClick={save}>
            {pending ? "Salvando…" : "Salvar e publicar"}
          </Button>
          {message ? (
            <p
              role={message.ok ? "status" : "alert"}
              className={`text-sm ${message.ok ? "text-muted-foreground" : "text-destructive"}`}
            >
              {message.text}
            </p>
          ) : null}
        </div>
      </div>

      <aside className="flex flex-col items-center gap-2 xl:sticky xl:top-4">
        <p className="text-sm font-medium">Como está no ar</p>
        <div className="h-[640px] w-[340px] overflow-hidden rounded-[2rem] border-8 border-foreground/80 bg-background shadow-xl">
          <iframe
            key={previewKey}
            src={previewPath}
            title="Prévia do seu site"
            className="size-full"
          />
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={refreshPreview}>
          Atualizar prévia
        </Button>
      </aside>
    </div>
  );
}
