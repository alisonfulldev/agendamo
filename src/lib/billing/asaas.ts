import "server-only";

import { getServerEnv, requireServerEnv } from "@/lib/env";

// Asaas API v3 (docs.asaas.com/reference). Auth header: access_token.

const BASE_URLS = {
  sandbox: "https://api-sandbox.asaas.com/v3",
  production: "https://api.asaas.com/v3",
} as const;

export type AsaasCycle = "MONTHLY" | "YEARLY";

export interface AsaasSubscription {
  id: string;
  customer: string;
  status: "ACTIVE" | "INACTIVE" | "EXPIRED";
  value: number;
  nextDueDate: string;
  cycle: AsaasCycle;
  externalReference?: string | null;
}

export interface AsaasPayment {
  id: string;
  subscription?: string;
  status: string;
  value: number;
  dueDate: string;
  invoiceUrl: string;
  paymentDate?: string | null;
  billingType: string;
}

export class AsaasError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export function isAsaasConfigured(): boolean {
  return Boolean(getServerEnv().ASAAS_API_KEY);
}

async function request<T>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  body?: unknown,
): Promise<T> {
  const env = requireServerEnv("ASAAS_API_KEY");
  const response = await fetch(`${BASE_URLS[env.ASAAS_ENV]}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      access_token: env.ASAAS_API_KEY,
      "User-Agent": "Lively",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  const text = await response.text();
  const json = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  if (!response.ok) {
    const errors = (json.errors as { description?: string }[] | undefined)
      ?.map((e) => e.description)
      .join("; ");
    throw new AsaasError(
      errors || `Asaas ${method} ${path} failed (${response.status})`,
      response.status,
    );
  }
  return json as T;
}

/** R$ value with two decimals, as Asaas expects (not cents). */
const reais = (cents: number) => Math.round(cents) / 100;

export function createCustomer(input: {
  name: string;
  cpfCnpj: string;
  email: string;
  mobilePhone?: string | null;
  externalReference: string;
}) {
  return request<{ id: string }>("POST", "/customers", input);
}

export function createSubscription(input: {
  customer: string;
  valueCents: number;
  cycle: AsaasCycle;
  nextDueDate: string;
  description: string;
  externalReference: string;
}) {
  return request<AsaasSubscription>("POST", "/subscriptions", {
    customer: input.customer,
    // UNDEFINED lets the customer pick card or Pix on the Asaas invoice page.
    billingType: "UNDEFINED",
    value: reais(input.valueCents),
    nextDueDate: input.nextDueDate,
    cycle: input.cycle,
    description: input.description,
    externalReference: input.externalReference,
  });
}

export function updateSubscription(
  id: string,
  input: { valueCents: number; cycle: AsaasCycle; description: string },
) {
  return request<AsaasSubscription>("PUT", `/subscriptions/${id}`, {
    value: reais(input.valueCents),
    cycle: input.cycle,
    description: input.description,
    updatePendingPayments: true,
  });
}

export function deleteSubscription(id: string) {
  return request<{ deleted: boolean; id: string }>("DELETE", `/subscriptions/${id}`);
}

export async function listSubscriptionPayments(id: string): Promise<AsaasPayment[]> {
  const result = await request<{ data: AsaasPayment[] }>("GET", `/subscriptions/${id}/payments`);
  return result.data ?? [];
}
