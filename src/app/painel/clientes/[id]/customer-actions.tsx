"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  deleteCustomerAction,
  removeOptInAction,
  saveCustomerNotesAction,
  sellPackageAction,
  setBlockedAction,
} from "../actions";

export function NotesForm({
  id,
  notes,
  birthdate,
}: {
  id: string;
  notes: string;
  birthdate: string;
}) {
  const [value, setValue] = useState(notes);
  const [date, setDate] = useState(birthdate);
  const [saved, setSaved] = useState<boolean | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="birthdate">Aniversário</Label>
      <Input
        id="birthdate"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="h-10 w-48"
      />
      <Label htmlFor="notes">Observações (só a equipe vê)</Label>
      <Textarea
        id="notes"
        rows={4}
        maxLength={2000}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <Button
        type="button"
        className="self-start"
        disabled={pending}
        onClick={() =>
          startTransition(async () =>
            setSaved((await saveCustomerNotesAction({ id, notes: value, birthdate: date })).ok),
          )
        }
      >
        Salvar
      </Button>
      {saved !== null ? (
        <p role="status" className="text-sm text-muted-foreground">
          {saved ? "Salvo." : "Não foi possível salvar."}
        </p>
      ) : null}
    </div>
  );
}

export function OwnerActions({
  id,
  blocked,
  optIn,
  slug,
}: {
  id: string;
  blocked: boolean;
  optIn: boolean;
  slug: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState("");
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={blocked ? "default" : "outline"}
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await setBlockedAction(id, !blocked);
              router.refresh();
            })
          }
        >
          {blocked ? "Desbloquear" : "Bloquear cliente"}
        </Button>
        {optIn ? (
          <Button
            type="button"
            variant="ghost"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await removeOptInAction(id);
                router.refresh();
              })
            }
          >
            Parar de enviar novidades
          </Button>
        ) : null}
      </div>
      <details className="rounded-lg border p-3 text-sm">
        <summary className="cursor-pointer font-medium">
          Excluir dados da cliente (pedido de LGPD)
        </summary>
        <p className="mt-2 text-muted-foreground">
          Apaga a cliente, os agendamentos dela e os pedidos feitos com o mesmo e-mail. Não dá para
          desfazer.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Input
            aria-label={`Digite ${slug} para confirmar`}
            placeholder={`Digite “${slug}”`}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="h-10 max-w-xs"
          />
          <Button
            type="button"
            variant="destructive"
            disabled={confirm !== slug || pending}
            onClick={() => startTransition(() => deleteCustomerAction(id))}
          >
            Excluir para sempre
          </Button>
        </div>
      </details>
    </div>
  );
}

export function SellPackage({
  customerId,
  packages,
}: {
  customerId: string;
  packages: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [packageId, setPackageId] = useState(packages[0]?.id ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  if (packages.length === 0)
    return <p className="text-sm text-muted-foreground">Crie pacotes em Vendas → Pacotes.</p>;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        aria-label="Pacote"
        value={packageId}
        onChange={(e) => setPackageId(e.target.value)}
        className="h-10 rounded-lg border border-input bg-transparent px-2 text-sm"
      >
        {packages.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <Button
        type="button"
        variant="outline"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await sellPackageAction(customerId, packageId);
            setMessage(result.message);
            router.refresh();
          })
        }
      >
        Registrar venda (pago fora da plataforma)
      </Button>
      {message ? <span className="text-sm text-muted-foreground">{message}</span> : null}
    </div>
  );
}
