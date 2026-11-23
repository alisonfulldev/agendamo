"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { sendPartnerCodeAction, verifyPartnerCodeAction } from "../actions";

const FIELDS = [
  { name: "name", label: "Nome completo", type: "text", autoComplete: "name" },
  { name: "email", label: "E-mail", type: "email", autoComplete: "email" },
  { name: "phone", label: "WhatsApp com DDD", type: "tel", autoComplete: "tel" },
  { name: "cpf", label: "CPF", type: "text", autoComplete: "off", inputMode: "numeric" },
  {
    name: "pixKey",
    label: "Chave Pix (para receber as comissões)",
    type: "text",
    autoComplete: "off",
  },
] as const;

type FieldName = (typeof FIELDS)[number]["name"];

/** Partner sign-up: data and rules, then the 4-digit code sent to the e-mail. */
export function PartnerForm({ terms }: { terms: readonly string[] }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<FieldName, string>>({
    name: "",
    email: "",
    phone: "",
    cpf: "",
    pixKey: "",
  });
  const [accepted, setAccepted] = useState(false);
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"data" | "code">("data");
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  const payload = () => ({ ...values, acceptedTerms: accepted });

  function sendCode() {
    startTransition(async () => {
      const result = await sendPartnerCodeAction(payload());
      if (result.ok) {
        setStep("code");
        setMessage(`Enviamos um código de 4 números para ${values.email.trim()}.`);
        setErrors({});
      } else {
        setMessage(result.message);
        setErrors(result.errors ?? {});
      }
    });
  }

  if (step === "code") {
    return (
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          startTransition(async () => {
            const result = await verifyPartnerCodeAction({ ...payload(), code });
            if (result.ok) router.push("/parceiros/painel");
            else setMessage(result.message);
          });
        }}
      >
        {message ? (
          <p role="status" className="text-sm text-muted-foreground">
            {message}
          </p>
        ) : null}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="partner-code">Código</Label>
          <Input
            id="partner-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={4}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className="h-11 text-center text-lg tracking-widest"
          />
        </div>
        <Button type="submit" size="lg" disabled={pending || code.length !== 4}>
          Concluir cadastro
        </Button>
        <Button type="button" variant="ghost" disabled={pending} onClick={() => setStep("data")}>
          Corrigir meus dados
        </Button>
      </form>
    );
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        sendCode();
      }}
    >
      {FIELDS.map((field) => (
        <div key={field.name} className="flex flex-col gap-1.5">
          <Label htmlFor={`partner-${field.name}`}>{field.label}</Label>
          <Input
            id={`partner-${field.name}`}
            type={field.type}
            autoComplete={field.autoComplete}
            inputMode={"inputMode" in field ? field.inputMode : undefined}
            value={values[field.name]}
            onChange={(e) => setValues((v) => ({ ...v, [field.name]: e.target.value }))}
            aria-invalid={errors[field.name] ? true : undefined}
            className="h-11"
          />
          {errors[field.name] ? (
            <p className="text-sm text-destructive">{errors[field.name]}</p>
          ) : null}
        </div>
      ))}
      <details className="rounded-lg border p-3 text-sm">
        <summary className="cursor-pointer font-medium">Regras do programa</summary>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
          {terms.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </details>
      <label className="flex items-start gap-2 text-sm">
        <Checkbox
          checked={accepted}
          onCheckedChange={(v) => setAccepted(v === true)}
          className="mt-0.5"
        />
        <span>Li e aceito as regras do programa de parceiros.</span>
      </label>
      {errors.acceptedTerms ? (
        <p className="text-sm text-destructive">{errors.acceptedTerms}</p>
      ) : null}
      {message ? (
        <p role="alert" className="text-sm text-destructive">
          {message}
        </p>
      ) : null}
      <Button type="submit" size="lg" disabled={pending}>
        Receber código no e-mail
      </Button>
    </form>
  );
}
