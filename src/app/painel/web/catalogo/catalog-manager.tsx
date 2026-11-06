"use client";

import { ArrowDown, ArrowUp, ImageIcon, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploadButton } from "@/components/uploads/image-upload-button";

import {
  deleteCatalogItemAction,
  removeCatalogPhotoAction,
  reorderCatalogAction,
  saveCatalogItemAction,
} from "../actions";

export interface CatalogRow {
  id: string;
  name: string;
  description: string;
  /** Price as typed ("49,90"); empty = no price. */
  price: string;
  category: string;
  active: boolean;
  imageUrl: string | null;
}

const EMPTY: Omit<CatalogRow, "id" | "imageUrl"> = {
  name: "",
  description: "",
  price: "",
  category: "",
  active: true,
};

/**
 * Services (site) or products (store) of a "Site ou Loja" account: add, edit, photo, order,
 * hide and delete. Everything goes live on save.
 */
export function CatalogManager({ items, store }: { items: CatalogRow[]; store: boolean }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | "new" | null>(items.length ? null : "new");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const noun = store ? "produto" : "serviço";

  const move = (index: number, delta: number) =>
    startTransition(async () => {
      const ids = items.map((i) => i.id);
      const [id] = ids.splice(index, 1);
      ids.splice(index + delta, 0, id!);
      await reorderCatalogAction(ids);
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-3">
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <ul className="flex flex-col gap-3">
        {items.map((item, index) => (
          <li key={item.id} className="rounded-xl border bg-card p-3">
            {editing === item.id ? (
              <ItemForm
                store={store}
                initial={item}
                onCancel={() => setEditing(null)}
                onSaved={() => {
                  setEditing(null);
                  router.refresh();
                }}
                onDelete={() =>
                  startTransition(async () => {
                    if (!confirm(`Excluir este ${noun}?`)) return;
                    const result = await deleteCatalogItemAction(item.id);
                    if (!result.ok) setError(result.error);
                    setEditing(null);
                    router.refresh();
                  })
                }
                photo={
                  <div className="flex flex-wrap items-center gap-2">
                    <ImageUploadButton kind="catalog" catalogItemId={item.id}>
                      {item.imageUrl ? "Trocar foto" : "Enviar foto"}
                    </ImageUploadButton>
                    {item.imageUrl ? (
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={pending}
                        onClick={() =>
                          startTransition(async () => {
                            await removeCatalogPhotoAction(item.id);
                            router.refresh();
                          })
                        }
                      >
                        Remover foto
                      </Button>
                    ) : null}
                  </div>
                }
              />
            ) : (
              <div className="flex items-center gap-3">
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- R2 public URL
                  <img
                    src={item.imageUrl}
                    alt=""
                    className="size-16 shrink-0 rounded-lg border object-cover"
                  />
                ) : (
                  <span className="flex size-16 shrink-0 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
                    <ImageIcon className="size-6" aria-hidden />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{item.name}</span>
                  <span className="block truncate text-sm text-muted-foreground">
                    {[
                      item.price ? `R$ ${item.price}` : null,
                      item.category,
                      item.active ? null : "Oculto",
                    ]
                      .filter(Boolean)
                      .join(" · ") || "Sem preço"}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Subir"
                    disabled={pending || index === 0}
                    onClick={() => move(index, -1)}
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Descer"
                    disabled={pending || index === items.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    <ArrowDown />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setEditing(item.id)}
                  >
                    Editar
                  </Button>
                </span>
              </div>
            )}
          </li>
        ))}
      </ul>

      {editing === "new" ? (
        <div className="rounded-xl border bg-card p-3">
          <ItemForm
            store={store}
            initial={EMPTY}
            onCancel={items.length ? () => setEditing(null) : undefined}
            onSaved={(id) => {
              // Straight into the new item, to add its photo.
              setEditing(id ?? null);
              router.refresh();
            }}
          />
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="self-start"
          onClick={() => setEditing("new")}
        >
          <Plus aria-hidden />
          Adicionar {noun}
        </Button>
      )}
    </div>
  );
}

function ItemForm({
  store,
  initial,
  onCancel,
  onSaved,
  onDelete,
  photo,
}: {
  store: boolean;
  initial: Omit<CatalogRow, "imageUrl"> | Omit<CatalogRow, "id" | "imageUrl">;
  onCancel?: () => void;
  onSaved: (id?: string) => void;
  onDelete?: () => void;
  photo?: React.ReactNode;
}) {
  const [values, setValues] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const id = "id" in initial ? initial.id : undefined;
  const set = (key: keyof typeof EMPTY, value: string | boolean) =>
    setValues((v) => ({ ...v, [key]: value }));

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const result = await saveCatalogItemAction({ ...values, id });
          if (!result.ok) setError(result.error);
          else onSaved(result.id);
        });
      }}
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`name-${id ?? "new"}`}>Nome</Label>
        <Input
          id={`name-${id ?? "new"}`}
          required
          maxLength={120}
          value={values.name}
          placeholder={store ? "Ex.: Vestido floral" : "Ex.: Consultoria trabalhista"}
          onChange={(e) => set("name", e.target.value)}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`price-${id ?? "new"}`}>Preço (R$){store ? "" : " · opcional"}</Label>
          <Input
            id={`price-${id ?? "new"}`}
            inputMode="decimal"
            maxLength={20}
            value={values.price}
            placeholder="49,90"
            onChange={(e) => set("price", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`category-${id ?? "new"}`}>Categoria · opcional</Label>
          <Input
            id={`category-${id ?? "new"}`}
            maxLength={60}
            value={values.category}
            placeholder={store ? "Ex.: Vestidos" : "Ex.: Empresas"}
            onChange={(e) => set("category", e.target.value)}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`description-${id ?? "new"}`}>Descrição · opcional</Label>
        <Textarea
          id={`description-${id ?? "new"}`}
          rows={3}
          maxLength={1000}
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </div>
      <label className="flex min-h-11 items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={values.active}
          onChange={(e) => set("active", e.target.checked)}
          className="size-5 accent-[var(--primary)]"
        />
        Mostrar no site
      </label>
      {photo ?? (
        <p className="text-sm text-muted-foreground">Depois de salvar, você coloca a foto.</p>
      )}
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando…" : "Salvar"}
        </Button>
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Fechar
          </Button>
        ) : null}
        {onDelete ? (
          <Button
            type="button"
            variant="ghost"
            className="ml-auto text-destructive"
            onClick={onDelete}
          >
            Excluir
          </Button>
        ) : null}
      </div>
    </form>
  );
}
