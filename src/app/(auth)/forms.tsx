"use client";

import Link from "next/link";
import { useActionState } from "react";

import { FormMessage, TextField } from "@/components/forms/field";
import { SubmitButton } from "@/components/forms/submit-button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { initialFormState } from "@/lib/forms";

import {
  requestPasswordResetAction,
  signInAction,
  signUpAction,
  updatePasswordAction,
} from "./actions";

export function SignInForm({ next }: { next?: string }) {
  const [state, action] = useActionState(signInAction, initialFormState);
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="next" value={next ?? ""} />
      <TextField
        name="email"
        label="E-mail"
        type="email"
        autoComplete="email"
        required
        state={state}
      />
      <TextField
        name="password"
        label="Senha"
        type="password"
        autoComplete="current-password"
        required
        state={state}
      />
      <FormMessage state={state} />
      <SubmitButton pendingLabel="Entrando…">Entrar</SubmitButton>
      <Link
        href="/recuperar-senha"
        className="text-center text-sm text-primary underline-offset-4 hover:underline"
      >
        Esqueci minha senha
      </Link>
    </form>
  );
}

export function SignUpForm() {
  const [state, action] = useActionState(signUpAction, initialFormState);
  if (state.ok) return <FormMessage state={state} />;
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <TextField
        name="email"
        label="E-mail"
        type="email"
        autoComplete="email"
        required
        state={state}
      />
      <TextField
        name="password"
        label="Senha"
        type="password"
        autoComplete="new-password"
        hint="Pelo menos 8 caracteres."
        required
        state={state}
      />
      <div className="flex flex-col gap-1.5">
        <div className="flex items-start gap-2">
          <Checkbox id="terms" name="terms" aria-invalid={state.errors?.terms ? true : undefined} />
          <Label htmlFor="terms" className="leading-snug font-normal">
            <span>
              Li e aceito os{" "}
              <Link href="/termos" className="text-primary underline" target="_blank">
                Termos de Uso
              </Link>{" "}
              e a{" "}
              <Link href="/privacidade" className="text-primary underline" target="_blank">
                Política de Privacidade
              </Link>
              .
            </span>
          </Label>
        </div>
        {state.errors?.terms ? (
          <p className="text-sm text-destructive">{state.errors.terms}</p>
        ) : null}
      </div>
      <FormMessage state={state} />
      <SubmitButton pendingLabel="Criando…">Criar conta grátis</SubmitButton>
    </form>
  );
}

export function RequestResetForm() {
  const [state, action] = useActionState(requestPasswordResetAction, initialFormState);
  if (state.ok) return <FormMessage state={state} />;
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <TextField
        name="email"
        label="E-mail"
        type="email"
        autoComplete="email"
        required
        state={state}
      />
      <FormMessage state={state} />
      <SubmitButton>Enviar link</SubmitButton>
    </form>
  );
}

export function NewPasswordForm() {
  const [state, action] = useActionState(updatePasswordAction, initialFormState);
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <TextField
        name="password"
        label="Nova senha"
        type="password"
        autoComplete="new-password"
        hint="Pelo menos 8 caracteres."
        required
        state={state}
      />
      <TextField
        name="confirm"
        label="Repita a nova senha"
        type="password"
        autoComplete="new-password"
        required
        state={state}
      />
      <FormMessage state={state} />
      <SubmitButton pendingLabel="Salvando…">Salvar nova senha</SubmitButton>
    </form>
  );
}
