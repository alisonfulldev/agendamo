"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { FieldShell } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TEMPLATE_LABELS, type MarketingSettings, type TemplateKey } from "@/lib/sales/settings";

import { createCouponAction, createPackageAction, saveMarketingSettingsAction } from "./actions";

const selectClass = "h-10 w-full rounded-lg border border-input bg-transparent px-2 text-sm";

function useSubmit() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const submit = (run: () => Promise<{ ok: boolean; message?: string }>, success = "Salvo.") =>
    startTransition(async () => {
      const result = await run();
      setMessage({
        ok: result.ok,
        text: result.ok ? (result.message ?? success) : (result.message ?? "Erro"),
      });
      if (result.ok) router.refresh();
    });
  const feedback = message ? (
    <p
      role={message.ok ? "status" : "alert"}
      className={`text-sm ${message.ok ? "text-primary" : "text-destructive"}`}
    >
      {message.text}
    </p>
  ) : null;
  return { pending, submit, feedback };
}

export function PackageForm({ services }: { services: { id: string; name: string }[] }) {
  const { pending, submit, feedback } = useSubmit();
  return (
    <form
      className="grid gap-3 sm:grid-cols-4"
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        submit(async () => {
          const result = await createPackageAction(Object.fromEntries(new FormData(form)));
          if (result.ok) form.reset();
          return result;
        }, "Pacote criado.");
      }}
    >
      <FieldShell name="serviceId" label="Serviço">
        <select id="serviceId" name="serviceId" className={selectClass}>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </FieldShell>
      <FieldShell name="name" label="Nome do pacote">
        <Input id="name" name="name" placeholder="Ex.: 10 sessões" className="h-10" />
      </FieldShell>
      <FieldShell name="sessions" label="Sessões">
        <Input
          id="sessions"
          name="sessions"
          type="number"
          min={2}
          max={100}
          defaultValue={5}
          className="h-10"
        />
      </FieldShell>
      <FieldShell name="price" label="Preço total (R$)">
        <Input id="price" name="price" inputMode="decimal" className="h-10" />
      </FieldShell>
      <div className="flex flex-col gap-2 sm:col-span-4">
        <Button type="submit" className="self-start" disabled={pending}>
          Criar pacote
        </Button>
        {feedback}
      </div>
    </form>
  );
}

export function CouponForm() {
  const { pending, submit, feedback } = useSubmit();
  const [type, setType] = useState<"percent" | "fixed">("percent");
  return (
    <form
      className="grid gap-3 sm:grid-cols-5"
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        submit(async () => {
          const result = await createCouponAction(Object.fromEntries(new FormData(form)));
          if (result.ok) form.reset();
          return result;
        }, "Cupom criado.");
      }}
    >
      <FieldShell name="code" label="Código">
        <Input id="code" name="code" placeholder="VOLTA10" className="h-10 uppercase" />
      </FieldShell>
      <FieldShell name="discountType" label="Tipo">
        <select
          id="discountType"
          name="discountType"
          value={type}
          onChange={(e) => setType(e.target.value as "percent" | "fixed")}
          className={selectClass}
        >
          <option value="percent">Porcentagem</option>
          <option value="fixed">Valor fixo</option>
        </select>
      </FieldShell>
      <FieldShell
        name="discountValue"
        label={type === "percent" ? "Desconto (%)" : "Desconto (R$)"}
      >
        <Input id="discountValue" name="discountValue" inputMode="decimal" className="h-10" />
      </FieldShell>
      <FieldShell name="validUntil" label="Válido até">
        <Input id="validUntil" name="validUntil" type="date" className="h-10" />
      </FieldShell>
      <FieldShell name="maxUses" label="Usos máximos">
        <Input id="maxUses" name="maxUses" type="number" min={1} className="h-10" />
      </FieldShell>
      <div className="flex flex-col gap-2 sm:col-span-5">
        <Button type="submit" className="self-start" disabled={pending}>
          Criar cupom
        </Button>
        {feedback}
      </div>
    </form>
  );
}

export function MarketingSettingsForm({
  settings,
  section,
}: {
  settings: MarketingSettings;
  section: "reactivation" | "referral";
}) {
  const { pending, submit, feedback } = useSubmit();
  const [draft, setDraft] = useState(settings);
  const keys: TemplateKey[] =
    section === "reactivation" ? ["reactivation", "return", "birthday"] : [];

  return (
    <div className="flex flex-col gap-4">
      {section === "reactivation" ? (
        <>
          <FieldShell name="inactive_days" label="Considerar que sumiu após (dias sem visita)">
            <Input
              id="inactive_days"
              type="number"
              min={15}
              max={730}
              value={draft.inactive_days}
              onChange={(e) => setDraft({ ...draft, inactive_days: Number(e.target.value) })}
              className="h-10 w-32"
            />
          </FieldShell>
          {keys.map((key) => (
            <FieldShell
              key={key}
              name={`template-${key}`}
              label={`Mensagem: ${TEMPLATE_LABELS[key]}`}
              hint="Use {customerName}, {business} e {service}."
            >
              <Textarea
                id={`template-${key}`}
                rows={3}
                maxLength={500}
                value={draft.templates[key]}
                onChange={(e) =>
                  setDraft({ ...draft, templates: { ...draft.templates, [key]: e.target.value } })
                }
              />
            </FieldShell>
          ))}
        </>
      ) : (
        <FieldShell
          name="referral_reward_text"
          label="Recompensa por indicação"
          hint="Ex.: 10% de desconto no próximo atendimento."
        >
          <Input
            id="referral_reward_text"
            maxLength={200}
            value={draft.referral_reward_text ?? ""}
            onChange={(e) => setDraft({ ...draft, referral_reward_text: e.target.value })}
            className="h-10"
          />
        </FieldShell>
      )}
      <Button
        type="button"
        className="self-start"
        disabled={pending}
        onClick={() =>
          submit(() =>
            saveMarketingSettingsAction(
              section === "reactivation"
                ? {
                    inactive_days: draft.inactive_days,
                    return_email_enabled: draft.return_email_enabled,
                    birthday_email_enabled: draft.birthday_email_enabled,
                    birthday_coupon_code: draft.birthday_coupon_code,
                    templates: Object.fromEntries(keys.map((k) => [k, draft.templates[k]])),
                  }
                : { referral_reward_text: draft.referral_reward_text },
            ),
          )
        }
      >
        Salvar
      </Button>
      {feedback}
    </div>
  );
}

export function TemplateEditor({
  settings,
  templateKey,
}: {
  settings: MarketingSettings;
  templateKey: TemplateKey;
}) {
  const { pending, submit, feedback } = useSubmit();
  const [value, setValue] = useState(settings.templates[templateKey]);
  return (
    <div className="flex flex-col gap-2">
      <FieldShell
        name={`tpl-${templateKey}`}
        label="Mensagem pronta"
        hint="Use {customerName}, {business} e {service}."
      >
        <Textarea
          id={`tpl-${templateKey}`}
          rows={3}
          maxLength={500}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </FieldShell>
      <Button
        type="button"
        size="sm"
        className="self-start"
        disabled={pending}
        onClick={() =>
          submit(() => saveMarketingSettingsAction({ templates: { [templateKey]: value } }))
        }
      >
        Salvar mensagem
      </Button>
      {feedback}
    </div>
  );
}
