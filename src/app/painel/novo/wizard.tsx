"use client";

import { Check, Copy, Download } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";

import { ServicesEditor, type ServiceDraft } from "@/components/business/services-editor";
import {
  WeeklyHoursEditor,
  type WorkingRangeDraft,
} from "@/components/business/weekly-hours-editor";
import { FieldShell } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { QR_PNG_DOWNLOAD_URL, QR_SVG_URL } from "@/lib/qr";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { DEFAULT_HOURS, onboardingSchema } from "@/lib/business/schemas";
import { clearDesiredSlug } from "@/lib/desired-slug";
import type { Segment } from "@/lib/db/types";
import { maskBrPhone } from "@/lib/phone";
import { slugify } from "@/lib/slug";

import { CREATION } from "@/content/creation";
import type { SignupChoice } from "@/lib/db/types";

import { checkSlugAction, createBusinessAction, type SlugCheck } from "./actions";

const PLAN_CHOICES = CREATION.signup.planOptions;

interface Draft {
  segment: Segment;
  name: string;
  slug: string;
  whatsapp: string;
  instagram: string;
  address: string;
  city: string;
  neighborhood: string;
  services: ServiceDraft[];
  hours: WorkingRangeDraft[];
  planChoice: SignupChoice;
}

// The segment comes from the brand (each brand is one niche), so it is not asked.
const STEPS = ["Nome e endereço", "Contato", "Serviços", "Expediente"] as const;

/** Fields validated at each step. */
const STEP_FIELDS: (keyof Draft)[][] = [
  ["name", "slug"],
  ["whatsapp", "instagram", "address", "city", "neighborhood"],
  ["services"],
  ["hours"],
];

export function OnboardingWizard({
  defaultSegment,
  suggestions,
  brandName,
  domain,
  initialSlug,
}: {
  defaultSegment: Segment;
  suggestions: { name: string; durationMinutes: number }[];
  brandName: string;
  domain: string;
  /** Link picked on the sales page before signing up (comes filled in). */
  initialSlug: string | null;
}) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>({
    segment: defaultSegment,
    name: "",
    slug: initialSlug ?? "",
    whatsapp: "",
    instagram: "",
    address: "",
    city: "",
    neighborhood: "",
    services: [],
    hours: DEFAULT_HOURS,
    planChoice: "free",
  });
  const [slugTouched, setSlugTouched] = useState(Boolean(initialSlug));
  const [checked, setChecked] = useState<{ slug: string; result: SlugCheck } | null>(null);
  const slugCheck = checked?.slug === draft.slug ? checked.result : null;
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [result, setResult] = useState<{ slug: string; pageUrl: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const headingRef = useRef<HTMLHeadingElement>(null);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  // Debounced real-time availability check (result is kept with the slug it belongs to).
  useEffect(() => {
    const slug = draft.slug;
    if (slug.length < 3) return;
    const timer = setTimeout(() => {
      checkSlugAction(slug)
        .then((result) => setChecked({ slug, result }))
        .catch(() => undefined);
    }, 400);
    return () => clearTimeout(timer);
  }, [draft.slug]);

  useEffect(() => headingRef.current?.focus(), [step]);

  function validate(fields: (keyof Draft)[]): boolean {
    const parsed = onboardingSchema.safeParse(draft);
    const stepErrors: Record<string, string> = {};
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        if (fields.includes(key as keyof Draft)) stepErrors[key] ??= issue.message;
      }
    }
    if (fields.includes("slug") && slugCheck && !slugCheck.available) {
      stepErrors.slug ??= slugCheck.message ?? "Endereço indisponível";
    }
    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  }

  function next() {
    if (!validate(STEP_FIELDS[step]!)) return;
    setMessage(null);
    setStep((s) => s + 1);
  }

  function submit() {
    if (!validate(STEP_FIELDS.flat())) return;
    startTransition(async () => {
      const response = await createBusinessAction(draft);
      if (response.ok) {
        clearDesiredSlug();
        setResult({ slug: response.slug, pageUrl: response.pageUrl });
      } else {
        setMessage(response.message);
        if (response.errors) setErrors(response.errors);
        if (response.errors?.slug) setStep(0);
      }
    });
  }

  if (result) return <Success pageUrl={result.pageUrl} slug={result.slug} />;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm text-muted-foreground">
          Passo {step + 1} de {STEPS.length}: {STEPS[step]}
        </p>
        <Progress
          value={((step + 1) / STEPS.length) * 100}
          className="mt-2"
          aria-label="Progresso do cadastro"
        />
      </div>

      <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-bold outline-none">
        {
          [
            "Como seu negócio se chama?",
            "Como as clientes falam com você?",
            "Quais serviços você oferece?",
            "Quando você atende?",
          ][step]
        }
      </h1>

      {step === 0 && (
        <div className="flex flex-col gap-4">
          <FieldShell name="name" label="Nome do negócio" error={errors.name}>
            <Input
              id="name"
              value={draft.name}
              maxLength={120}
              autoComplete="organization"
              onChange={(e) => {
                const name = e.target.value;
                // Suggest the slug from the name until the owner edits it.
                setDraft((d) => ({ ...d, name, slug: slugTouched ? d.slug : slugify(name) }));
              }}
              className="h-10"
            />
          </FieldShell>
          <FieldShell
            name="slug"
            label="Seu link"
            error={errors.slug}
            hint={
              slugCheck?.available ? (
                <span className="text-primary">Disponível!</span>
              ) : slugCheck?.message ? (
                <>
                  {slugCheck.message}{" "}
                  {slugCheck.suggestion && (
                    <button
                      type="button"
                      className="font-medium text-primary underline"
                      onClick={() => {
                        setSlugTouched(true);
                        set("slug", slugCheck.suggestion!);
                      }}
                    >
                      Usar {slugCheck.suggestion}
                    </button>
                  )}
                </>
              ) : (
                "Letras minúsculas, números e hífens."
              )
            }
          >
            <div className="flex items-center rounded-lg border border-input focus-within:ring-3 focus-within:ring-ring/50">
              <span className="pl-3 text-sm text-muted-foreground">{domain}/</span>
              <input
                id="slug"
                value={draft.slug}
                maxLength={40}
                autoCapitalize="none"
                spellCheck={false}
                onChange={(e) => {
                  setSlugTouched(true);
                  set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                }}
                aria-invalid={errors.slug ? true : undefined}
                className="h-10 min-w-0 flex-1 bg-transparent pr-3 text-sm outline-none"
              />
            </div>
          </FieldShell>
        </div>
      )}

      {step === 1 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldShell
            name="whatsapp"
            label="WhatsApp"
            error={errors.whatsapp}
            hint="Para a cliente falar com você quando não houver horário livre."
          >
            <Input
              id="whatsapp"
              inputMode="tel"
              autoComplete="tel"
              placeholder="(11) 99999-8888"
              value={draft.whatsapp}
              onChange={(e) => set("whatsapp", maskBrPhone(e.target.value))}
              className="h-10"
            />
          </FieldShell>
          <FieldShell name="instagram" label="Instagram" error={errors.instagram}>
            <Input
              id="instagram"
              placeholder="@seuperfil"
              autoCapitalize="none"
              value={draft.instagram}
              onChange={(e) => set("instagram", e.target.value)}
              className="h-10"
            />
          </FieldShell>
          <div className="sm:col-span-2">
            <FieldShell name="address" label="Endereço" error={errors.address}>
              <Input
                id="address"
                autoComplete="street-address"
                placeholder="Rua, número"
                value={draft.address}
                onChange={(e) => set("address", e.target.value)}
                className="h-10"
              />
            </FieldShell>
          </div>
          <FieldShell name="city" label="Cidade" error={errors.city}>
            <Input
              id="city"
              autoComplete="address-level2"
              value={draft.city}
              onChange={(e) => set("city", e.target.value)}
              className="h-10"
            />
          </FieldShell>
          <FieldShell name="neighborhood" label="Bairro" error={errors.neighborhood}>
            <Input
              id="neighborhood"
              value={draft.neighborhood}
              onChange={(e) => set("neighborhood", e.target.value)}
              className="h-10"
            />
          </FieldShell>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-2">
          <ServicesEditor
            value={draft.services}
            onChange={(services) => set("services", services)}
            suggestions={suggestions}
          />
          {errors.services && <p className="text-sm text-destructive">{errors.services}</p>}
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-2">
          <WeeklyHoursEditor value={draft.hours} onChange={(hours) => set("hours", hours)} />
          {errors.hours && <p className="text-sm text-destructive">{errors.hours}</p>}
          <fieldset className="mt-4 flex flex-col gap-2">
            <legend className="mb-1 font-medium">Como você quer começar? (sem cartão)</legend>
            {(Object.keys(PLAN_CHOICES) as SignupChoice[]).map((choice) => (
              <label
                key={choice}
                className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2.5 text-sm"
              >
                <input
                  type="radio"
                  name="planChoice"
                  checked={draft.planChoice === choice}
                  onChange={() => set("planChoice", choice)}
                />
                {PLAN_CHOICES[choice]}
              </label>
            ))}
          </fieldset>
        </div>
      )}

      {message && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {message}
        </p>
      )}

      <div className="flex justify-between gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0 || pending}
        >
          Voltar
        </Button>
        {step < STEPS.length - 1 ? (
          <Button type="button" className="h-10" onClick={next}>
            Continuar
          </Button>
        ) : (
          <Button type="button" className="h-10" onClick={submit} disabled={pending}>
            {pending ? "Criando seu chat…" : `Criar meu chat de agendamento no ${brandName}`}
          </Button>
        )}
      </div>
    </div>
  );
}

function Success({ pageUrl, slug }: { pageUrl: string; slug: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <h1 className="text-2xl font-bold">Seu chat de agendamento está no ar!</h1>
      <p className="text-muted-foreground">
        Divulgue este link no WhatsApp, Instagram, Facebook e nos botões do seu site: ele abre
        direto no chat.
      </p>
      <div className="flex w-full max-w-md items-center gap-2 rounded-xl border bg-card p-2">
        <a
          href={pageUrl}
          target="_blank"
          rel="noreferrer"
          className="min-w-0 flex-1 truncate px-2 text-left text-sm font-medium"
        >
          {pageUrl}
        </a>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={async () => {
            await navigator.clipboard.writeText(pageUrl);
            setCopied(true);
          }}
        >
          {copied ? <Check /> : <Copy />} {copied ? "Copiado" : "Copiar"}
        </Button>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element -- generated QR code */}
      <img
        src={QR_SVG_URL}
        alt={`QR code do link ${slug}`}
        width={200}
        height={200}
        className="rounded-xl bg-card p-2"
      />
      <div className="flex flex-wrap justify-center gap-2">
        <Button asChild variant="outline">
          <a href={QR_PNG_DOWNLOAD_URL} download>
            <Download /> Baixar QR code
          </a>
        </Button>
        {/* Full page load: the panel layout (header and menu) only exists once the business does. */}
        <Button
          type="button"
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- a soft navigation would keep the layout without header and menu
          onClick={() => window.location.assign("/painel")}
        >
          Ir para o painel
        </Button>
      </div>
    </div>
  );
}
