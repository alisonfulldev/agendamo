"use client";

import { useActionState, useState } from "react";

import { FormMessage, TextField } from "@/components/forms/field";
import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { initialFormState } from "@/lib/forms";

import { changePasswordAction, deleteAccountAction } from "./actions";

export function ChangePasswordForm() {
  const [state, action] = useActionState(changePasswordAction, initialFormState);
  return (
    <form action={action} className="flex max-w-sm flex-col gap-4" noValidate>
      <TextField
        name="current"
        label="Senha atual"
        type="password"
        autoComplete="current-password"
        state={state}
      />
      <TextField
        name="password"
        label="Nova senha"
        type="password"
        autoComplete="new-password"
        state={state}
      />
      <TextField
        name="confirm"
        label="Repita a nova senha"
        type="password"
        autoComplete="new-password"
        state={state}
      />
      <FormMessage state={state} />
      <SubmitButton className="self-start" pendingLabel="Salvando…">
        Trocar senha
      </SubmitButton>
    </form>
  );
}

export function DeleteAccountDialog({
  confirmationWord,
  hasBusiness,
}: {
  confirmationWord: string;
  hasBusiness: boolean;
}) {
  const [state, action] = useActionState(deleteAccountAction, initialFormState);
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">Excluir minha conta</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir conta</DialogTitle>
          <DialogDescription>
            {hasBusiness
              ? "Sua página, agenda, clientes, fotos e todos os dados do negócio serão apagados para sempre."
              : "Sua conta será apagada para sempre."}
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="flex flex-col gap-4">
          <TextField
            name="confirmation"
            label={`Digite “${confirmationWord}” para confirmar`}
            autoComplete="off"
            state={state}
          />
          <FormMessage state={state} />
          <SubmitButton variant="destructive" pendingLabel="Excluindo…">
            Excluir para sempre
          </SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
