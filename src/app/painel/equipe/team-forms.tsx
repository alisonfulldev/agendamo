"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { formatAmount, formatBRL, formatDuration, parseBRL } from "@/lib/money";

import {
  deleteProfessionalAction,
  deleteResourceAction,
  inviteStaffAction,
  removeMemberAction,
  saveProfessionalAction,
  saveProfessionalServicesAction,
  saveResourceAction,
} from "./actions";

type Message = { ok: boolean; text: string } | null;

function Feedback({ message }: { message: Message }) {
  if (!message) return null;
  return (
    <p
      role={message.ok ? "status" : "alert"}
      className={`text-sm ${message.ok ? "text-primary" : "text-destructive"}`}
    >
      {message.text}
    </p>
  );
}

export function ProfessionalHeader({
  id,
  name,
  active,
}: {
  id: string;
  name: string;
  active: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState(name);
  const [isActive, setActive] = useState(active);
  const [message, setMessage] = useState<Message>(null);
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          aria-label="Nome do profissional"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="h-10 max-w-xs"
        />
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={isActive} onCheckedChange={setActive} /> Ativo
        </label>
        <Button
          type="button"
          size="sm"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await saveProfessionalAction({ id, name: value, active: isActive });
              setMessage(
                result.ok ? { ok: true, text: "Salvo." } : { ok: false, text: result.message },
              );
              router.refresh();
            })
          }
        >
          Salvar
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label={`Excluir ${name}`}
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              if (!window.confirm(`Excluir ${name}?`)) return;
              const result = await deleteProfessionalAction(id);
              setMessage(result.ok ? null : { ok: false, text: result.message });
              router.refresh();
            })
          }
        >
          <Trash2 />
        </Button>
      </div>
      <Feedback message={message} />
    </div>
  );
}

export function ProfessionalServices({
  professionalId,
  services,
  links,
}: {
  professionalId: string;
  services: { id: string; name: string; durationMinutes: number; priceCents: number }[];
  links: { serviceId: string; durationOverride: number | null; priceOverride: number | null }[];
}) {
  const [items, setItems] = useState(() =>
    services.map((s) => {
      const link = links.find((l) => l.serviceId === s.id);
      return {
        serviceId: s.id,
        enabled: Boolean(link),
        duration: link?.durationOverride ? String(link.durationOverride) : "",
        price:
          link?.priceOverride !== null && link?.priceOverride !== undefined
            ? formatAmount(link.priceOverride)
            : "",
      };
    }),
  );
  const [message, setMessage] = useState<Message>(null);
  const [pending, startTransition] = useTransition();
  const set = (index: number, patch: Partial<(typeof items)[number]>) =>
    setItems((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  return (
    <div className="flex flex-col gap-2">
      <table className="w-full text-sm">
        <thead className="text-left text-muted-foreground">
          <tr>
            <th className="py-1">Faz</th>
            <th className="py-1">Serviço</th>
            <th className="py-1">Duração própria (min)</th>
            <th className="py-1">Preço próprio (R$)</th>
          </tr>
        </thead>
        <tbody>
          {services.map((service, index) => (
            <tr key={service.id}>
              <td className="py-1">
                <Checkbox
                  aria-label={`Faz ${service.name}`}
                  checked={items[index]!.enabled}
                  onCheckedChange={(c) => set(index, { enabled: c === true })}
                />
              </td>
              <td className="py-1">{service.name}</td>
              <td className="py-1">
                <Input
                  aria-label={`Duração de ${service.name}`}
                  inputMode="numeric"
                  placeholder={formatDuration(service.durationMinutes)}
                  value={items[index]!.duration}
                  onChange={(e) => set(index, { duration: e.target.value.replace(/\D/g, "") })}
                  className="h-9 w-28"
                />
              </td>
              <td className="py-1">
                <Input
                  aria-label={`Preço de ${service.name}`}
                  inputMode="decimal"
                  placeholder={formatBRL(service.priceCents)}
                  value={items[index]!.price}
                  onChange={(e) => set(index, { price: e.target.value })}
                  className="h-9 w-28"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Button
        type="button"
        size="sm"
        className="self-start"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await saveProfessionalServicesAction({
              professionalId,
              items: items.map((i) => ({
                serviceId: i.serviceId,
                enabled: i.enabled,
                durationOverride: i.duration ? Number(i.duration) : null,
                priceOverride: i.price ? parseBRL(i.price) : null,
              })),
            });
            setMessage(
              result.ok
                ? { ok: true, text: result.message ?? "Salvo." }
                : { ok: false, text: result.message },
            );
          })
        }
      >
        Salvar serviços
      </Button>
      <Feedback message={message} />
    </div>
  );
}

export function StaffAccess({
  professionalId,
  member,
  enabled,
}: {
  professionalId: string;
  member: { id: string; email: string } | null;
  enabled: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<Message>(null);
  const [pending, startTransition] = useTransition();
  if (member) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-sm">
        Acesso: <span className="font-medium">{member.email}</span>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              if (!window.confirm("Remover o acesso desta pessoa?")) return;
              await removeMemberAction(member.id);
              router.refresh();
            })
          }
        >
          Remover acesso
        </Button>
      </div>
    );
  }
  if (!enabled)
    return (
      <p className="text-sm text-muted-foreground">
        Convide o profissional para acessar a própria agenda no plano Equipe.
      </p>
    );
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <Input
          aria-label="E-mail para convite"
          type="email"
          placeholder="E-mail do profissional"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-10 max-w-xs"
        />
        <Button
          type="button"
          variant="outline"
          disabled={pending || !email}
          onClick={() =>
            startTransition(async () => {
              const result = await inviteStaffAction({ professionalId, email });
              setMessage(
                result.ok
                  ? { ok: true, text: result.message ?? "Convite enviado." }
                  : { ok: false, text: result.message },
              );
              router.refresh();
            })
          }
        >
          Convidar
        </Button>
      </div>
      <Feedback message={message} />
    </div>
  );
}

export function NewProfessionalButton({ disabled }: { disabled: boolean }) {
  const router = useRouter();
  const [message, setMessage] = useState<Message>(null);
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex flex-col gap-1">
      <Button
        type="button"
        disabled={disabled || pending}
        onClick={() => {
          const name = window.prompt("Nome do profissional");
          if (!name) return;
          startTransition(async () => {
            const result = await saveProfessionalAction({ id: null, name, active: true });
            setMessage(result.ok ? null : { ok: false, text: result.message });
            router.refresh();
          });
        }}
      >
        Adicionar profissional
      </Button>
      <Feedback message={message} />
    </div>
  );
}

export function ResourcesEditor({
  resources,
  services,
}: {
  resources: { id: string; name: string; serviceIds: string[] }[];
  services: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [drafts, setDrafts] = useState(resources);
  const [message, setMessage] = useState<Message>(null);
  const [pending, startTransition] = useTransition();

  const save = (draft: { id: string | null; name: string; serviceIds: string[] }) =>
    startTransition(async () => {
      const result = await saveResourceAction(draft);
      setMessage(
        result.ok ? { ok: true, text: "Recurso salvo." } : { ok: false, text: result.message },
      );
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-3">
      {drafts.map((resource, index) => (
        <div key={resource.id} className="flex flex-col gap-2 rounded-xl border p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              aria-label="Nome do recurso"
              value={resource.name}
              onChange={(e) =>
                setDrafts((d) =>
                  d.map((r, i) => (i === index ? { ...r, name: e.target.value } : r)),
                )
              }
              className="h-10 max-w-xs"
            />
            <Button type="button" size="sm" disabled={pending} onClick={() => save(resource)}>
              Salvar
            </Button>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              aria-label={`Excluir ${resource.name}`}
              onClick={() =>
                startTransition(async () => {
                  if (!window.confirm(`Excluir ${resource.name}?`)) return;
                  await deleteResourceAction(resource.id);
                  router.refresh();
                })
              }
            >
              <Trash2 />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">Serviços que usam este recurso:</p>
          <div className="flex flex-wrap gap-3">
            {services.map((service) => (
              <label key={service.id} className="flex items-center gap-1.5 text-sm">
                <Checkbox
                  checked={resource.serviceIds.includes(service.id)}
                  onCheckedChange={(c) =>
                    setDrafts((d) =>
                      d.map((r, i) =>
                        i === index
                          ? {
                              ...r,
                              serviceIds: c
                                ? [...r.serviceIds, service.id]
                                : r.serviceIds.filter((id) => id !== service.id),
                            }
                          : r,
                      ),
                    )
                  }
                />
                {service.name}
              </label>
            ))}
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        className="self-start"
        disabled={pending}
        onClick={() => {
          const name = window.prompt("Nome do recurso (ex.: Sala 1, Maca)");
          if (name) save({ id: null, name, serviceIds: [] });
        }}
      >
        Adicionar recurso
      </Button>
      <Feedback message={message} />
    </div>
  );
}
