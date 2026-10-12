"use client";

import { useActionState } from "react";

import { FormMessage, TextField } from "@/components/forms/field";
import { SubmitButton } from "@/components/forms/submit-button";
import { initialFormState } from "@/lib/forms";

import { adminSignInAction } from "./actions";

export function AdminSignInForm() {
  const [state, action] = useActionState(adminSignInAction, initialFormState);
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <TextField
        name="email"
        label="E-mail"
        type="email"
        autoComplete="username"
        defaultValue={state.values?.email}
        state={state}
      />
      <TextField
        name="password"
        label="Senha"
        type="password"
        autoComplete="current-password"
        state={state}
      />
      <FormMessage state={state} />
      <SubmitButton pendingLabel="Entrando…">Entrar</SubmitButton>
    </form>
  );
}
