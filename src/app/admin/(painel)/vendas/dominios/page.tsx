import Link from "next/link";

import { CopyTextButton } from "@/components/panel/copy-text-button";
import { Button } from "@/components/ui/button";
import { DEFAULT_DNS, type DomainRow } from "@/lib/domains/jobs";
import { registroBrUrl } from "@/lib/domains/registro";
import { createAdminClient } from "@/lib/supabase/admin";

import { AdminSection } from "../../ui";
import { DomainButton } from "./domain-buttons";

const STATUS = {
  awaiting_payment: "Aguardando pagamento",
  awaiting_registration: "Registrar no Registro.br",
  connecting: "Aguardando o DNS",
  live: "No ar",
} as const;

const brDate = (iso: string | null) => (iso ? iso.split("-").reverse().join("/") : "—");

/**
 * Own domains sold on WhatsApp (2026-11-06): what to do with each one. Registro.br has no API,
 * so the registration is manual (in the customer's name); connecting and checking are automatic.
 */
export default async function AdminDomainsPage() {
  const admin = createAdminClient();
  const [{ data }, { data: sales }] = await Promise.all([
    admin
      .from("custom_domains")
      .select(
        "id, business_id, domain, verified, status, expires_at, business:businesses(name, slug, brand_key)",
      )
      .order("updated_at", { ascending: false })
      .limit(100),
    admin.from("assisted_sales").select("business_id, payer_name").not("domain", "is", null),
  ]);
  const domains = (data ?? []) as unknown as DomainRow[];
  const payer = new Map(
    (sales ?? []).map((s) => [s.business_id as string, s.payer_name as string]),
  );
  const todo = domains.filter(
    (d) => d.status === "awaiting_registration" || d.status === "connecting",
  );
  const others = domains.filter((d) => !todo.includes(d));

  return (
    <>
      <p>
        <Link href="/admin/vendas" className="text-sm text-primary">
          ← Vendas
        </Link>
      </p>
      <h1 className="text-2xl font-bold">Domínios</h1>

      {todo.length === 0 ? (
        <AdminSection title="Para fazer">
          <p className="text-sm text-muted-foreground">Nenhum domínio esperando por você.</p>
        </AdminSection>
      ) : null}

      {todo.map((d) => (
        <AdminSection
          key={d.id}
          title={`${d.domain} · ${STATUS[d.status]}`}
          description={`${d.business.name}${payer.get(d.business_id) ? ` · titular: ${payer.get(d.business_id)}` : ""}`}
        >
          {d.status === "awaiting_registration" ? (
            <ol className="flex list-decimal flex-col gap-4 pl-5 text-sm">
              <li>
                Registre no Registro.br <strong>no nome e CPF do cliente</strong> (o CPF que ele te
                passou no WhatsApp).
                <div className="mt-2">
                  <Button asChild variant="outline" size="sm">
                    <a href={registroBrUrl(d.domain)} target="_blank" rel="noreferrer">
                      Abrir {d.domain} no Registro.br
                    </a>
                  </Button>
                </div>
              </li>
              <li>
                No Registro.br, em <strong>DNS › Editar zona</strong>, crie estas 2 entradas:
                <ul className="mt-2 flex flex-col gap-2">
                  {DEFAULT_DNS.map((record) => (
                    <li
                      key={record.type}
                      className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-muted p-2"
                    >
                      <span className="font-mono">{record.type}</span>
                      <span>nome: {record.name}</span>
                      <span className="font-mono">{record.value}</span>
                      <CopyTextButton text={record.value} label="Copiar" />
                    </li>
                  ))}
                </ul>
              </li>
              <li>
                Pronto? Conecte. O sistema liga o domínio e confere o DNS sozinho (todo dia, ou
                quando você tocar em &quot;Verificar agora&quot;).
                <div className="mt-2">
                  <DomainButton id={d.id} step="connect" label="Já registrei: conectar" />
                </div>
              </li>
            </ol>
          ) : (
            <div className="flex flex-col gap-3 text-sm">
              <p className="text-muted-foreground">
                O DNS pode levar de alguns minutos a algumas horas para propagar. Quando estiver
                certo, o site entra no ar em {d.domain} e o cliente recebe o aviso.
              </p>
              <DomainButton id={d.id} step="check" label="Verificar agora" />
            </div>
          )}
        </AdminSection>
      ))}

      <AdminSection title="Todos os domínios">
        {others.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum.</p>
        ) : (
          <ul className="divide-y">
            {others.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{d.domain}</span>
                  <span className="block text-sm text-muted-foreground">
                    {d.business.name} · vence {brDate(d.expires_at)}
                  </span>
                </span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                  {STATUS[d.status]}
                </span>
                {d.status === "live" ? (
                  <DomainButton id={d.id} step="renew" label="Renovei (+1 ano)" variant="outline" />
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </AdminSection>
    </>
  );
}
